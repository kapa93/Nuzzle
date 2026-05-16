// @ts-ignore Deno resolves remote imports for Supabase Edge Functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: { get: (name: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

type Action = "search" | "details" | "import" | "nearby" | "dogSpots";
type PlaceType = "dog_beach" | "dog_park" | "trail" | "park" | "other";

type GoogleAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  currentOpeningHours?: unknown;
  attributions?: unknown[];
  photos?: GooglePhoto[];
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: GoogleAddressComponent[];
  types?: string[];
};

type GooglePhoto = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: unknown[];
};

type GooglePlaceCandidate = {
  googlePlaceId: string;
  name: string;
  formattedAddress: string | null;
  shortFormattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  neighborhood: string | null;
  placeType: PlaceType;
  types: string[];
  rating: number | null;
  userRatingCount: number | null;
};

type GooglePlacePreview = GooglePlaceCandidate & {
  displayName: string;
  currentOpeningHours: unknown | null;
  attributions: unknown[];
  photos: Array<{
    name: string;
    widthPx: number | null;
    heightPx: number | null;
    authorAttributions: unknown[];
  }>;
  rating: number | null;
  ratingCount: number | null;
  openNow: boolean | null;
  shortFormattedAddress: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const googleFieldMask =
  "places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.addressComponents,places.types,places.rating,places.userRatingCount";
const googleDetailsFieldMask =
  "id,displayName,formattedAddress,location,addressComponents,types";
const googlePreviewFieldMask =
  "id,displayName,currentOpeningHours,attributions,photos,rating,userRatingCount,shortFormattedAddress,formattedAddress,location,addressComponents,types";

const GOOGLE_SEARCH_INCLUDED_TYPES = ["dog_park", "park", "beach", "hiking_area"] as const;

/** Primary typed search: keep under Places API limits while surfacing more than the default top 5. */
const FOCUSED_SEARCH_MAX_RESULTS = 12;
const BROAD_SEARCH_MAX_RESULTS = 15;
const AUGMENT_SEARCH_MAX_RESULTS = 15;

/** Places API (New) max `locationBias` circle radius is 50_000 m — applied only around the user's coordinates. */
function userLocationBias(location: { latitude: number; longitude: number }): Record<string, unknown> {
  return {
    locationBias: {
      circle: {
        center: { latitude: location.latitude, longitude: location.longitude },
        radius: 50_000,
      },
    },
  };
}

function candidateHasBlockedSearchType(candidate: GooglePlaceCandidate): boolean {
  const normalizedTypes = candidate.types.map((value) => value.trim().toLowerCase());
  return normalizedTypes.some((value) => IMPORT_BLOCKED_TYPE_HINTS.has(value));
}

function filterExploreSearchCandidates(candidates: GooglePlaceCandidate[]): GooglePlaceCandidate[] {
  return candidates.filter((candidate) => !candidateHasBlockedSearchType(candidate));
}
const IMPORT_ALLOWED_TYPE_HINTS = new Set([
  "dog_park",
  "park",
  "beach",
  "hiking_area",
  "trail",
  "campground",
  "natural_feature",
  "national_park",
]);
const IMPORT_BLOCKED_TYPE_HINTS = new Set([
  "restaurant",
  "cafe",
  "bar",
  "liquor_store",
  "store",
  "shopping_mall",
  "supermarket",
  "department_store",
  "lodging",
  "hotel",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getGoogleApiKey() {
  return Deno.env.get("GOOGLE_PLACES_API_KEY") ?? Deno.env.get("GOOGLE_MAPS_API_KEY") ?? "";
}

function getAddressComponent(place: GooglePlace, type: string) {
  return (
    place.addressComponents?.find((component) => component.types?.includes(type))?.longText ?? null
  );
}

function mapPlaceType(types: string[] = []): PlaceType {
  if (types.includes("dog_beach") || types.includes("beach")) return "dog_beach";
  if (types.includes("dog_park")) return "dog_park";
  if (types.includes("park")) return "park";
  if (
    types.includes("hiking_area") ||
    types.includes("campground") ||
    types.includes("natural_feature")
  ) {
    return "trail";
  }
  return "other";
}

function toCandidate(place: GooglePlace): GooglePlaceCandidate | null {
  const googlePlaceId = place.id;
  const name = place.displayName?.text;
  if (!googlePlaceId || !name) return null;

  const city =
    getAddressComponent(place, "locality") ??
    getAddressComponent(place, "postal_town") ??
    getAddressComponent(place, "administrative_area_level_3");
  const neighborhood =
    getAddressComponent(place, "neighborhood") ??
    getAddressComponent(place, "sublocality") ??
    getAddressComponent(place, "sublocality_level_1");

  return {
    googlePlaceId,
    name,
    formattedAddress: place.formattedAddress ?? null,
    shortFormattedAddress: place.shortFormattedAddress ?? null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    city,
    neighborhood,
    placeType: mapPlaceType(place.types),
    types: place.types ?? [],
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
  };
}

function toPreview(place: GooglePlace): GooglePlacePreview | null {
  const candidate = toCandidate(place);
  const displayName = place.displayName?.text;
  if (!candidate || !displayName) return null;

  return {
    ...candidate,
    displayName,
    currentOpeningHours: place.currentOpeningHours ?? null,
    attributions: place.attributions ?? [],
    photos: (place.photos ?? [])
      .filter((photo): photo is GooglePhoto & { name: string } => !!photo.name)
      .slice(0, 5)
      .map((photo) => ({
        name: photo.name,
        widthPx: photo.widthPx ?? null,
        heightPx: photo.heightPx ?? null,
        authorAttributions: photo.authorAttributions ?? [],
      })),
    rating: place.rating ?? null,
    ratingCount: place.userRatingCount ?? null,
    openNow:
      typeof (place.currentOpeningHours as { openNow?: unknown } | null)?.openNow === "boolean"
        ? ((place.currentOpeningHours as { openNow?: boolean }).openNow ?? null)
        : null,
    shortFormattedAddress: place.shortFormattedAddress ?? place.formattedAddress ?? null,
  };
}

class ValidationError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

function isImportAllowed(candidate: GooglePlaceCandidate): { allowed: boolean; reason?: string } {
  const normalizedTypes = candidate.types.map((value) => value.trim().toLowerCase());
  const hasBlockedType = normalizedTypes.some((value) => IMPORT_BLOCKED_TYPE_HINTS.has(value));
  if (hasBlockedType) {
    return {
      allowed: false,
      reason: "This place type is not supported yet. Save a park, beach, dog park, or trail.",
    };
  }

  if (candidate.placeType === "other") {
    const hasAllowedHint = normalizedTypes.some((value) => IMPORT_ALLOWED_TYPE_HINTS.has(value));
    if (!hasAllowedHint) {
      return {
        allowed: false,
        reason: "Only parks, beaches, dog parks, and trails can be saved right now.",
      };
    }
  }

  return { allowed: true };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function slugFor(candidate: GooglePlaceCandidate) {
  const idSuffix = candidate.googlePlaceId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(-8);
  const base = slugify(candidate.name) || "google-place";
  return `${base}-${idSuffix}`;
}

async function searchTextToCandidates(
  apiKey: string,
  payload: Record<string, unknown>
): Promise<GooglePlaceCandidate[]> {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": googleFieldMask,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google Places search failed: ${message}`);
  }

  const body = (await response.json()) as { places?: GooglePlace[] };
  return (body.places ?? []).map(toCandidate).filter((place): place is GooglePlaceCandidate => !!place);
}

/**
 * Extra Text Search calls so short place names (e.g. "del mar") still surface dog beaches:
 * plain "del mar" + includedType beach often ranks city/parks above "Del Mar Dog Beach".
 */
async function searchAugmentedOutdoorPlaces(
  query: string,
  apiKey: string,
  location?: { latitude: number; longitude: number }
): Promise<GooglePlaceCandidate[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const lower = q.toLowerCase();
  const locationSpread = location ? userLocationBias(location) : {};

  const tasks: Promise<GooglePlaceCandidate[]>[] = [];

  if (!lower.includes("dog beach")) {
    tasks.push(
      searchTextToCandidates(apiKey, {
        textQuery: `${q} dog beach`,
        includedType: "beach",
        maxResultCount: AUGMENT_SEARCH_MAX_RESULTS,
        rankPreference: "RELEVANCE",
        regionCode: "US",
        languageCode: "en",
        ...locationSpread,
      })
    );
  }

  if (!lower.includes("beach")) {
    tasks.push(
      searchTextToCandidates(apiKey, {
        textQuery: `${q} beach`,
        includedType: "beach",
        maxResultCount: AUGMENT_SEARCH_MAX_RESULTS,
        rankPreference: "RELEVANCE",
        regionCode: "US",
        languageCode: "en",
        ...locationSpread,
      })
    );
  }

  if (!lower.includes("dog park")) {
    tasks.push(
      searchTextToCandidates(apiKey, {
        textQuery: `${q} dog park`,
        includedType: "dog_park",
        maxResultCount: AUGMENT_SEARCH_MAX_RESULTS,
        rankPreference: "RELEVANCE",
        regionCode: "US",
        languageCode: "en",
        ...locationSpread,
      })
    );
  }

  if (tasks.length === 0) return [];
  const batches = await Promise.all(tasks);
  return batches.flat();
}

async function searchGooglePlaces(
  query: string,
  apiKey: string,
  location?: { latitude: number; longitude: number }
) {
  const locationSpread = location ? userLocationBias(location) : {};
  const placeLists = await Promise.all(
    GOOGLE_SEARCH_INCLUDED_TYPES.map((includedType) =>
      searchTextToCandidates(apiKey, {
        textQuery: query,
        maxResultCount: FOCUSED_SEARCH_MAX_RESULTS,
        includedType,
        rankPreference: "RELEVANCE",
        regionCode: "US",
        languageCode: "en",
        ...locationSpread,
      })
    )
  );
  return placeLists.flat();
}

async function searchGooglePlacesBroad(
  query: string,
  apiKey: string,
  location?: { latitude: number; longitude: number }
) {
  return searchTextToCandidates(apiKey, {
    textQuery: query,
    maxResultCount: BROAD_SEARCH_MAX_RESULTS,
    rankPreference: "RELEVANCE",
    regionCode: "US",
    languageCode: "en",
    ...(location ? userLocationBias(location) : {}),
  });
}

async function getGooglePlace(googlePlaceId: string, apiKey: string) {
  const response = await fetch(`https://places.googleapis.com/v1/places/${googlePlaceId}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": googleDetailsFieldMask,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google Places details failed: ${message}`);
  }

  const candidate = toCandidate((await response.json()) as GooglePlace);
  if (!candidate) throw new Error("Google Places details returned an invalid place");
  return candidate;
}

async function getGooglePlacePreview(googlePlaceId: string, apiKey: string) {
  const response = await fetch(`https://places.googleapis.com/v1/places/${googlePlaceId}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": googlePreviewFieldMask,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google Places details failed: ${message}`);
  }

  const preview = toPreview((await response.json()) as GooglePlace);
  if (!preview) throw new Error("Google Places details returned an invalid place");
  return preview;
}

async function proxyGooglePhoto(photoName: string, apiKey: string) {
  if (!photoName.startsWith("places/") || !photoName.includes("/photos/")) {
    return json({ error: "Invalid photo name" }, 400);
  }

  const photoUrl = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
  photoUrl.searchParams.set("maxWidthPx", "900");
  photoUrl.searchParams.set("maxHeightPx", "650");
  photoUrl.searchParams.set("key", apiKey);

  const response = await fetch(photoUrl);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google Places photo failed: ${message}`);
  }

  return new Response(response.body, {
    status: response.status,
    headers: {
      ...corsHeaders,
      "Content-Type": response.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

const TEXT_SEARCH_QUERIES = ["dog park", "dog beach", "off leash dog"] as const;
const TEXT_SEARCH_RADIUS_METERS = 50_000;
const TEXT_SEARCH_MAX_RESULTS = 20;
const NEARBY_GENERAL_TYPES = ["park", "beach", "hiking_area", "campground"] as const;
const NEARBY_GENERAL_MAX_RESULTS = 20;
const NEARBY_GENERAL_RADIUS_METERS = 5_000;

async function searchNearbyPlaces(
  location: { latitude: number; longitude: number },
  apiKey: string
): Promise<GooglePlaceCandidate[]> {
  const fetchTextSearch = async (query: string): Promise<GooglePlaceCandidate[]> => {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": googleFieldMask,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: TEXT_SEARCH_MAX_RESULTS,
        locationBias: {
          circle: {
            center: { latitude: location.latitude, longitude: location.longitude },
            radius: TEXT_SEARCH_RADIUS_METERS,
          },
        },
        regionCode: "US",
        languageCode: "en",
      }),
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { places?: GooglePlace[] };
    return (body.places ?? []).map(toCandidate).filter((c): c is GooglePlaceCandidate => !!c);
  };

  const fetchNearby = async (): Promise<GooglePlaceCandidate[]> => {
    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": googleFieldMask,
      },
      body: JSON.stringify({
        includedTypes: NEARBY_GENERAL_TYPES,
        maxResultCount: NEARBY_GENERAL_MAX_RESULTS,
        rankPreference: "DISTANCE",
        locationRestriction: {
          circle: {
            center: { latitude: location.latitude, longitude: location.longitude },
            radius: NEARBY_GENERAL_RADIUS_METERS,
          },
        },
        regionCode: "US",
        languageCode: "en",
      }),
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { places?: GooglePlace[] };
    return (body.places ?? []).map(toCandidate).filter((c): c is GooglePlaceCandidate => !!c);
  };

  const [nearbyResults, ...textResults] = await Promise.all([
    fetchNearby(),
    ...TEXT_SEARCH_QUERIES.map(fetchTextSearch),
  ]);

  // Text search (dog-specific) results take priority; nearby fills in local parks/trails
  const seen = new Set<string>();
  const merged: GooglePlaceCandidate[] = [];
  for (const c of [...textResults.flat(), ...nearbyResults]) {
    if (!seen.has(c.googlePlaceId)) {
      seen.add(c.googlePlaceId);
      merged.push(c);
    }
  }
  return merged;
}

const DOG_SPOTS_TEXT_QUERIES = [
  "dog friendly cafe",
  "dog friendly bar",
  "dog friendly restaurant",
  "dog store",
] as const;
const DOG_SPOTS_TEXT_SEARCH_RADIUS_METERS = 50_000;
const DOG_SPOTS_TEXT_SEARCH_MAX_RESULTS = 20;
const DOG_SPOTS_NEARBY_TYPES = ["cafe", "bar", "restaurant", "pet_store", "dog_cafe"] as const;
const DOG_SPOTS_NEARBY_MAX_RESULTS = 20;
const DOG_SPOTS_NEARBY_RADIUS_METERS = 15_000;

async function searchDogSpots(
  location: { latitude: number; longitude: number },
  apiKey: string
): Promise<GooglePlaceCandidate[]> {
  const fetchTextSearch = async (query: string): Promise<GooglePlaceCandidate[]> => {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": googleFieldMask,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: DOG_SPOTS_TEXT_SEARCH_MAX_RESULTS,
        locationBias: {
          circle: {
            center: { latitude: location.latitude, longitude: location.longitude },
            radius: DOG_SPOTS_TEXT_SEARCH_RADIUS_METERS,
          },
        },
        regionCode: "US",
        languageCode: "en",
      }),
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { places?: GooglePlace[] };
    return (body.places ?? []).map(toCandidate).filter((c): c is GooglePlaceCandidate => !!c);
  };

  const fetchNearby = async (): Promise<GooglePlaceCandidate[]> => {
    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": googleFieldMask,
      },
      body: JSON.stringify({
        includedTypes: DOG_SPOTS_NEARBY_TYPES,
        maxResultCount: DOG_SPOTS_NEARBY_MAX_RESULTS,
        rankPreference: "DISTANCE",
        locationRestriction: {
          circle: {
            center: { latitude: location.latitude, longitude: location.longitude },
            radius: DOG_SPOTS_NEARBY_RADIUS_METERS,
          },
        },
        regionCode: "US",
        languageCode: "en",
      }),
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { places?: GooglePlace[] };
    return (body.places ?? []).map(toCandidate).filter((c): c is GooglePlaceCandidate => !!c);
  };

  const [nearbyResults, ...textResults] = await Promise.all([
    fetchNearby(),
    ...DOG_SPOTS_TEXT_QUERIES.map(fetchTextSearch),
  ]);

  // Text-search results (dog-specific queries) take priority; nearby fills in surrounding businesses
  const seen = new Set<string>();
  const merged: GooglePlaceCandidate[] = [];
  for (const c of [...textResults.flat(), ...nearbyResults]) {
    if (!seen.has(c.googlePlaceId)) {
      seen.add(c.googlePlaceId);
      merged.push(c);
    }
  }
  return merged;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  try {
    const googleApiKey = getGoogleApiKey();
    if (!googleApiKey) throw new Error("Missing GOOGLE_PLACES_API_KEY");

    const url = new URL(req.url);

    // Photo proxy is unauthenticated — Google photo references are already opaque,
    // time-limited strings that contain no user-specific data.
    if (req.method === "GET") {
      if (url.searchParams.get("action") === "photo") {
        const photoName = url.searchParams.get("name")?.trim();
        if (!photoName) return json({ error: "name is required" }, 400);
        return await proxyGooglePhoto(photoName, googleApiKey);
      }
      return json({ error: "Invalid action" }, 400);
    }

    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    const queryAccessToken = url.searchParams.get("access_token");
    const authorization =
      req.headers.get("Authorization") ?? (queryAccessToken ? `Bearer ${queryAccessToken}` : "");
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);

  const body = (await req.json()) as {
      action?: Action;
      query?: string;
      googlePlaceId?: string;
      bannerPhotoName?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    };

    if (body.action === "search") {
      const query = body.query?.trim();
      if (!query || query.length < 2) return json({ places: [] });
      const location =
        typeof body.latitude === "number" &&
        Number.isFinite(body.latitude) &&
        typeof body.longitude === "number" &&
        Number.isFinite(body.longitude)
          ? { latitude: body.latitude, longitude: body.longitude }
          : undefined;

      const [focusedResults, broadResults, augmentedResults] = await Promise.all([
        searchGooglePlaces(query, googleApiKey, location),
        searchGooglePlacesBroad(query, googleApiKey, location),
        searchAugmentedOutdoorPlaces(query, googleApiKey, location),
      ]);
      // Augmented queries first so client-side dedupe prefers dog-beach–biased hits when ids repeat.
      const merged = filterExploreSearchCandidates([
        ...augmentedResults,
        ...focusedResults,
        ...broadResults,
      ]);
      return json({ places: merged });
    }

    if (body.action === "details") {
      const googlePlaceId = body.googlePlaceId?.trim();
      if (!googlePlaceId) return json({ error: "googlePlaceId is required" }, 400);
      const place = await getGooglePlacePreview(googlePlaceId, googleApiKey);
      return json({ place });
    }

    if (body.action === "nearby") {
      const lat = body.latitude;
      const lng = body.longitude;
      if (
        typeof lat !== "number" ||
        !Number.isFinite(lat) ||
        typeof lng !== "number" ||
        !Number.isFinite(lng)
      ) {
        return json({ error: "latitude and longitude are required for nearby search" }, 400);
      }
      const places = await searchNearbyPlaces({ latitude: lat, longitude: lng }, googleApiKey);
      return json({ places });
    }

    if (body.action === "dogSpots") {
      const lat = body.latitude;
      const lng = body.longitude;
      if (
        typeof lat !== "number" ||
        !Number.isFinite(lat) ||
        typeof lng !== "number" ||
        !Number.isFinite(lng)
      ) {
        return json({ error: "latitude and longitude are required for dog spots search" }, 400);
      }
      const places = await searchDogSpots({ latitude: lat, longitude: lng }, googleApiKey);
      return json({ places });
    }

    if (body.action === "import") {
      const googlePlaceId = body.googlePlaceId?.trim();
      if (!googlePlaceId) return json({ error: "googlePlaceId is required" }, 400);

      const preview = await getGooglePlacePreview(googlePlaceId, googleApiKey);
      const validation = isImportAllowed(preview);
      if (!validation.allowed) {
        throw new ValidationError(validation.reason ?? "This place can't be saved right now.");
      }

      const allPhotoNames = preview.photos
        .map((p) => p.name)
        .filter(Boolean);

      const bannerPhotoName =
        typeof body.bannerPhotoName === 'string' &&
        body.bannerPhotoName.startsWith('places/') &&
        body.bannerPhotoName.includes('/photos/')
          ? body.bannerPhotoName
          : null;

      const otherPhotoNames = allPhotoNames.filter((n) => n !== bannerPhotoName);
      const orderedPhotoNames = bannerPhotoName
        ? [bannerPhotoName, ...otherPhotoNames]
        : allPhotoNames;

      const photoNames = orderedPhotoNames.slice(0, 3);

      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
      });
      const { data, error } = await adminClient
        .from("places")
        .upsert(
          {
            google_place_id: preview.googlePlaceId,
            name: preview.name,
            slug: slugFor(preview),
            place_type: preview.placeType,
            city: preview.city,
            neighborhood: preview.neighborhood,
            latitude: preview.latitude,
            longitude: preview.longitude,
            description: preview.formattedAddress,
            photos: photoNames,
            is_active: true,
            supports_check_in: true,
          },
          { onConflict: "google_place_id" },
        )
        .select("*")
        .single();

      if (error) throw error;
      return json({ place: data });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (error instanceof ValidationError) {
      return json({ error: message }, error.status);
    }
    return json({ error: message }, 500);
  }
});
