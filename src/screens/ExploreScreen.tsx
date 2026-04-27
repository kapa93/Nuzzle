import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
  ImageBackground,
  Platform,
  TextInput,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { MapPinned } from "lucide-react-native";
import * as Location from "expo-location";
import { getPackItems } from "@/utils/breedAssets";
import { useStackHeaderHeight } from "@/hooks/useStackHeaderHeight";
import {
  getNearbyGooglePlaces,
  listActivePlaces,
  searchGooglePlacesWithOptions,
} from "@/api/places";
import { PlaceRow } from "@/components/PlaceRow";
import { useSavedPlaces, useToggleSavedPlace, useSavedPlacesWithActivity } from "@/hooks/useSavedPlaces";
import { useAuthStore } from "@/store/authStore";
import { MyPlacesSheet } from "@/components/MyPlacesSheet";
import { colors, radius, spacing, typography } from "@/theme";
import { getDistanceMeters } from "@/utils/location";
import type { GooglePlaceCandidate, Place } from "@/types";

const CARD_GAP = spacing.md;
const H_PADDING = spacing.lg;
const NUM_COLUMNS = 2;
const TABS_SEARCH_ANIM_DURATION = 220;
const TABS_SEARCH_ESTIMATED_HEIGHT = 118;
// Slide farther than the overlay's own height so the content is fully off-screen
// before the fade completes — gives a more prominent slide and softer fade, matching
// the HomeScreen stack header animation.
const TABS_SEARCH_HIDE_OVERSHOOT = 40;
const SCROLL_DIRECTION_THRESHOLD = 3;
const AT_TOP_THRESHOLD = 10;
const AT_BOTTOM_THRESHOLD = 10;
const GOOGLE_PLACE_SEARCH_MIN_LENGTH = 2;
const GOOGLE_PLACE_SEARCH_DEBOUNCE_MS = 350;
const GOOGLE_PLACE_SEARCH_TARGET_RESULTS = 5;
const SEARCH_RANK_DISTANCE_SCALE_METERS = 15_000;

type LocalScrollDirection = "up" | "down";

type Tab = "breeds" | "places";

type UserCoords = { latitude: number; longitude: number } | null;
type PlacesLocationState = "unknown" | "granted" | "denied";

type SearchBucket = {
  inNuzzle: Place[];
  morePlaces: GooglePlaceCandidate[];
};

function normalizePlaceText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function googleCandidateSubtitle(candidate: GooglePlaceCandidate): string {
  const locationLine = [candidate.neighborhood, candidate.city]
    .filter(Boolean)
    .join(", ");
  return locationLine || candidate.shortFormattedAddress || candidate.formattedAddress || "";
}

function placeLocationLine(place: Place): string {
  return [place.neighborhood, place.city].filter(Boolean).join(" ");
}

function rankDbPlacesForSearch({
  places,
  query,
  savedPlaceIds,
  coords,
}: {
  places: Place[];
  query: string;
  savedPlaceIds: Set<string>;
  coords: UserCoords;
}): Place[] {
  const normalizedQuery = normalizePlaceText(query);
  if (!normalizedQuery) return places;

  return [...places]
    .filter((place) => {
      const haystack = [place.name, placeLocationLine(place), place.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .sort((left, right) => {
      const leftName = left.name.toLowerCase();
      const rightName = right.name.toLowerCase();
      const leftStartsWith = Number(leftName.startsWith(normalizedQuery));
      const rightStartsWith = Number(rightName.startsWith(normalizedQuery));
      const leftSaved = Number(savedPlaceIds.has(left.id));
      const rightSaved = Number(savedPlaceIds.has(right.id));

      let leftDistanceScore = 0;
      let rightDistanceScore = 0;
      if (
        coords &&
        left.latitude != null &&
        left.longitude != null &&
        right.latitude != null &&
        right.longitude != null
      ) {
        const leftDistance = getDistanceMeters(
          coords.latitude,
          coords.longitude,
          left.latitude,
          left.longitude
        );
        const rightDistance = getDistanceMeters(
          coords.latitude,
          coords.longitude,
          right.latitude,
          right.longitude
        );
        leftDistanceScore = Math.max(0, 1 - leftDistance / SEARCH_RANK_DISTANCE_SCALE_METERS);
        rightDistanceScore = Math.max(0, 1 - rightDistance / SEARCH_RANK_DISTANCE_SCALE_METERS);
      }

      const leftScore = leftStartsWith * 4 + leftSaved * 3 + leftDistanceScore;
      const rightScore = rightStartsWith * 4 + rightSaved * 3 + rightDistanceScore;
      if (rightScore !== leftScore) return rightScore - leftScore;
      return leftName.localeCompare(rightName);
    });
}

const NEARBY_INITIAL_COUNT = 5;
const NEARBY_LOAD_MORE_COUNT = 5;
const NEARBY_PROXIMITY_DEDUP_THRESHOLD_METERS = 50;
const NUZZLE_SECTION_UNBOOKMARKED_RADIUS_METERS = 100_000;
const NUZZLE_UNBOOKMARKED_INITIAL_COUNT = 5;
const NUZZLE_UNBOOKMARKED_LOAD_MORE_COUNT = 5;



function nearbyScore(candidate: GooglePlaceCandidate, coords: UserCoords): number {
  const placeTypeWeight: Record<string, number> = {
    dog_beach: 5,
    dog_park: 4,
    park: 2,
    trail: 2,
    other: 0,
  };

  const typeScore = placeTypeWeight[candidate.placeType] ?? 0;
  const ratingBonus = Math.log((candidate.userRatingCount ?? 0) + 1) * 0.3;

  const distanceMeters =
    coords && candidate.latitude != null && candidate.longitude != null
      ? getDistanceMeters(coords.latitude, coords.longitude, candidate.latitude, candidate.longitude)
      : 50_000;
  const distancePenalty = distanceMeters / 50_000;

  return typeScore + ratingBonus - distancePenalty;
}

function rankNearbyCandidates(
  candidates: GooglePlaceCandidate[],
  coords: UserCoords
): GooglePlaceCandidate[] {
  const hasDog = (c: GooglePlaceCandidate) => c.name.toLowerCase().includes("dog");

  const sorted = [...candidates].sort((a, b) => {
    // Dog-named places always rank above non-dog-named places
    const aDog = hasDog(a) ? 1 : 0;
    const bDog = hasDog(b) ? 1 : 0;
    if (aDog !== bDog) return bDog - aDog;
    return nearbyScore(b, coords) - nearbyScore(a, coords);
  });

  // Drop candidates that are within the threshold of a higher-ranked candidate —
  // these are duplicate Google Place entries for the same physical location.
  // When a duplicate is found, keep whichever has the more descriptive (longer) name.
  const kept: GooglePlaceCandidate[] = [];
  for (const candidate of sorted) {
    if (candidate.latitude == null || candidate.longitude == null) {
      kept.push(candidate);
      continue;
    }
    const dupIndex = kept.findIndex(
      (k) =>
        k.latitude != null &&
        k.longitude != null &&
        getDistanceMeters(candidate.latitude!, candidate.longitude!, k.latitude, k.longitude) <
          NEARBY_PROXIMITY_DEDUP_THRESHOLD_METERS
    );
    if (dupIndex === -1) {
      kept.push(candidate);
    } else {
      const existing = kept[dupIndex];
      const candidateHasDog = candidate.name.toLowerCase().includes("dog");
      const existingHasDog = existing.name.toLowerCase().includes("dog");
      const preferCandidate = candidateHasDog !== existingHasDog
        ? candidateHasDog
        : candidate.name.length > existing.name.length;
      if (preferCandidate) kept[dupIndex] = candidate;
    }
  }

  // Second pass: remove any remaining exact name duplicates (catches same-named entries
  // that are >50m apart in Google's data, e.g. two Dusty Rhodes Park entries).
  const seenNames = new Set<string>();
  return kept.filter((c) => {
    const key = c.name.trim().toLowerCase();
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });
}

function rankGoogleCandidatesForSearch({
  candidates,
  query,
  coords,
}: {
  candidates: GooglePlaceCandidate[];
  query: string;
  coords: UserCoords;
}): GooglePlaceCandidate[] {
  const normalizedQuery = normalizePlaceText(query);
  /** When the user did not type "dog beach", prefer venues with that in the title (e.g. "Del Mar Dog Beach"). */
  const boostDogBeachByName =
    normalizedQuery.length > 0 && !normalizedQuery.includes("dog beach");
  const dogBeachNameBoost = (name: string) =>
    boostDogBeachByName && (name.includes("dog beach") || name.includes("dogbeach")) ? 4 : 0;

  const placeTypeWeight: Record<string, number> = {
    dog_park: 4,
    dog_beach: 4,
    park: 3,
    trail: 2,
    other: 0,
  };

  return [...candidates].sort((left, right) => {
    const leftName = normalizePlaceText(left.name);
    const rightName = normalizePlaceText(right.name);
    const leftAddress = normalizePlaceText(left.formattedAddress);
    const rightAddress = normalizePlaceText(right.formattedAddress);

    const leftStartsWith = Number(leftName.startsWith(normalizedQuery));
    const rightStartsWith = Number(rightName.startsWith(normalizedQuery));
    const leftContains = Number(leftName.includes(normalizedQuery));
    const rightContains = Number(rightName.includes(normalizedQuery));
    const leftAddressContains = Number(leftAddress.includes(normalizedQuery));
    const rightAddressContains = Number(rightAddress.includes(normalizedQuery));

    const leftDogType = placeTypeWeight[left.placeType] ?? 0;
    const rightDogType = placeTypeWeight[right.placeType] ?? 0;

    let leftDistanceScore = 0;
    let rightDistanceScore = 0;
    let leftLocalityPenalty = 0;
    let rightLocalityPenalty = 0;
    if (
      coords &&
      left.latitude != null &&
      left.longitude != null &&
      right.latitude != null &&
      right.longitude != null
    ) {
      const leftDistance = getDistanceMeters(
        coords.latitude,
        coords.longitude,
        left.latitude,
        left.longitude
      );
      const rightDistance = getDistanceMeters(
        coords.latitude,
        coords.longitude,
        right.latitude,
        right.longitude
      );
      leftDistanceScore = Math.max(0, 1 - leftDistance / SEARCH_RANK_DISTANCE_SCALE_METERS);
      rightDistanceScore = Math.max(0, 1 - rightDistance / SEARCH_RANK_DISTANCE_SCALE_METERS);

      if (leftDistance > 300_000) leftLocalityPenalty -= 6;
      else if (leftDistance > 150_000) leftLocalityPenalty -= 3;
      if (rightDistance > 300_000) rightLocalityPenalty -= 6;
      else if (rightDistance > 150_000) rightLocalityPenalty -= 3;
    }

    const leftScore =
      leftStartsWith * 5 +
      leftContains * 2 +
      leftAddressContains * 1 +
      leftDogType * 2 +
      dogBeachNameBoost(leftName) +
      leftDistanceScore +
      leftLocalityPenalty;
    const rightScore =
      rightStartsWith * 5 +
      rightContains * 2 +
      rightAddressContains * 1 +
      rightDogType * 2 +
      dogBeachNameBoost(rightName) +
      rightDistanceScore +
      rightLocalityPenalty;

    if (rightScore !== leftScore) return rightScore - leftScore;
    return leftName.localeCompare(rightName);
  });
}

export function ExploreScreen({
  navigation,
  route,
}: {
  navigation: {
    navigate: (s: string, p?: object) => void;
    setOptions: (opts: object) => void;
  };
  route: { params?: { initialTab?: Tab } };
}) {
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const headerHeight = useStackHeaderHeight();
  const cardWidth = (width - H_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
  const packItems = getPackItems();
  const [activeTab, setActiveTab] = useState<Tab>(route.params?.initialTab ?? "breeds");
  const [searchQuery, setSearchQuery] = useState("");
  const [myPlacesOpen, setMyPlacesOpen] = useState(false);
  const [debouncedPlaceSearch, setDebouncedPlaceSearch] = useState("");
  const [coords, setCoords] = useState<UserCoords>(null);
  const [placesLocationState, setPlacesLocationState] = useState<PlacesLocationState>("unknown");
  const [nearbyDisplayCount, setNearbyDisplayCount] = useState(NEARBY_INITIAL_COUNT);
  const [nuzzleUnbookmarkedDisplayCount, setNuzzleUnbookmarkedDisplayCount] = useState(NUZZLE_UNBOOKMARKED_INITIAL_COUNT);
  const hasRequestedPlacesPermissionRef = useRef(false);
  const [tabsSearchHeight, setTabsSearchHeight] = useState(TABS_SEARCH_ESTIMATED_HEIGHT);
  const [scrollDirection, setScrollDirection] = useState<LocalScrollDirection>("up");
  const lastOffsetRef = useRef(0);
  const tabsSearchTranslate = useSharedValue(0);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const y = contentOffset.y;
      const diff = y - lastOffsetRef.current;
      lastOffsetRef.current = y;
      if (Math.abs(diff) < SCROLL_DIRECTION_THRESHOLD) return;
      if (y < AT_TOP_THRESHOLD && diff > 0) return;
      const atBottom =
        y + layoutMeasurement.height >= contentSize.height - AT_BOTTOM_THRESHOLD;
      if (atBottom && diff < 0) return;
      setScrollDirection(diff > 0 ? "down" : "up");
    },
    []
  );

  const hideOffset = tabsSearchHeight + TABS_SEARCH_HIDE_OVERSHOOT;

  useEffect(() => {
    const shouldHide = scrollDirection === "down";
    tabsSearchTranslate.value = withTiming(shouldHide ? -hideOffset : 0, {
      duration: TABS_SEARCH_ANIM_DURATION,
    });
  }, [scrollDirection, hideOffset, tabsSearchTranslate]);

  const tabsSearchAnimatedStyle = useAnimatedStyle(() => {
    // Piecewise curve: stay near-opaque while the overlay is still visually on-screen,
    // then fall off quickly during the off-screen overshoot. This keeps the slide feeling
    // like the dominant motion and the fade very subtle.
    const opacity = interpolate(
      tabsSearchTranslate.value,
      [-hideOffset, -tabsSearchHeight, 0],
      [0, 0.75, 1]
    );
    return {
      opacity,
      transform: [{ translateY: tabsSearchTranslate.value }],
    };
  });

  const handleTabsSearchLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && Math.abs(h - tabsSearchHeight) > 0.5) {
      setTabsSearchHeight(h);
    }
  };

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSearchQuery("");
  };
  const { savedPlaces, dogCounts, isLoading: savedPlacesLoading } = useSavedPlacesWithActivity(user?.id);

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitleText}>Explore</Text>
      ),
      headerLeft: () => (
        <Pressable
          onPress={() => setMyPlacesOpen(true)}
          style={({ pressed }) => [styles.myPlacesChip, pressed && styles.myPlacesChipPressed]}
          accessibilityRole="button"
          accessibilityLabel="My Places"
        >
          <MapPinned size={26} color="#000000" />
        </Pressable>
      ),
    });
  }, [navigation]);

  const { data: places = [] } = useQuery({
    queryKey: ["places"],
    queryFn: listActivePlaces,
    enabled: !!user?.id,
  });

  const { savedPlaceIds } = useSavedPlaces(user?.id);
  const toggleSave = useToggleSavedPlace();

  useEffect(() => {
    if (activeTab !== "places") return;

    let cancelled = false;

    const loadLocation = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        let status = permission.status;

        if (status !== "granted" && !hasRequestedPlacesPermissionRef.current) {
          hasRequestedPlacesPermissionRef.current = true;
          const requested = await Location.requestForegroundPermissionsAsync();
          status = requested.status;
        }

        if (status !== "granted") {
          if (!cancelled) {
            setCoords(null);
            setPlacesLocationState("denied");
          }
          return;
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setPlacesLocationState("granted");
        }
      } catch {
        if (!cancelled) {
          setCoords(null);
          setPlacesLocationState("denied");
        }
      }
    };

    loadLocation();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredPackItems = useMemo(() => {
    if (!normalizedQuery) return packItems;
    return packItems.filter((item) =>
      item.label.toLowerCase().includes(normalizedQuery)
    );
  }, [packItems, normalizedQuery]);

  const inNuzzleSearchResults = useMemo(
    () =>
      rankDbPlacesForSearch({
        places,
        query: normalizedQuery,
        savedPlaceIds,
        coords,
      }),
    [places, normalizedQuery, savedPlaceIds, coords]
  );

  const trimmedPlaceSearch = searchQuery.trim();
  const hasActivePlaceSearch = activeTab === "places" && normalizedQuery.length > 0;
  const shouldSearchGooglePlaces =
    activeTab === "places" &&
    trimmedPlaceSearch.length >= GOOGLE_PLACE_SEARCH_MIN_LENGTH &&
    (inNuzzleSearchResults.length < GOOGLE_PLACE_SEARCH_TARGET_RESULTS ||
      normalizedQuery.length >= 4);

  useEffect(() => {
    if (!shouldSearchGooglePlaces) {
      setDebouncedPlaceSearch("");
      return;
    }

    const timeout = setTimeout(() => {
      setDebouncedPlaceSearch(trimmedPlaceSearch);
    }, GOOGLE_PLACE_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [shouldSearchGooglePlaces, trimmedPlaceSearch]);

  const googlePlacesQuery = useQuery({
    queryKey: [
      "googlePlaces",
      debouncedPlaceSearch,
      coords ? `${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}` : "no-location",
    ],
    queryFn: () =>
      searchGooglePlacesWithOptions({
        query: debouncedPlaceSearch,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      }),
    enabled:
      shouldSearchGooglePlaces &&
      debouncedPlaceSearch.length >= GOOGLE_PLACE_SEARCH_MIN_LENGTH &&
      debouncedPlaceSearch === trimmedPlaceSearch &&
      placesLocationState !== "unknown",
    staleTime: 5 * 60_000,
    retry: false,
  });

  const googleCandidates = useMemo(() => {
    if (!hasActivePlaceSearch) return [];
    if (debouncedPlaceSearch !== trimmedPlaceSearch) return [];

    const candidates = googlePlacesQuery.data ?? [];
    const seenIds = new Set<string>();
    const seenVisibleRows = new Set<string>();

    return candidates.filter((candidate) => {
      const normalizedId = normalizePlaceText(candidate.googlePlaceId);
      const visibleRowKey = [
        normalizePlaceText(candidate.name),
        normalizePlaceText(googleCandidateSubtitle(candidate)),
      ].join("|");

      if (normalizedId && seenIds.has(normalizedId)) return false;
      if (seenVisibleRows.has(visibleRowKey)) return false;

      if (normalizedId) seenIds.add(normalizedId);
      seenVisibleRows.add(visibleRowKey);
      return true;
    });
  }, [hasActivePlaceSearch, debouncedPlaceSearch, trimmedPlaceSearch, googlePlacesQuery.data]);
  const googlePlacesErrorMessage =
    googlePlacesQuery.error instanceof Error ? googlePlacesQuery.error.message : null;

  const searchBuckets = useMemo<SearchBucket>(() => {
    const dbGoogleIds = new Set(
      places.map((place) => normalizePlaceText(place.google_place_id)).filter(Boolean)
    );
    const dbNameCityKeys = new Set(
      places.map((place) =>
        `${normalizePlaceText(place.name)}|${normalizePlaceText(place.city ?? place.neighborhood ?? "")}`
      )
    );

    const morePlaces = rankGoogleCandidatesForSearch({
      candidates: googleCandidates.filter((candidate) => {
        const normalizedGoogleId = normalizePlaceText(candidate.googlePlaceId);
        if (normalizedGoogleId && dbGoogleIds.has(normalizedGoogleId)) return false;
        const key = `${normalizePlaceText(candidate.name)}|${normalizePlaceText(
          candidate.city ?? candidate.neighborhood ?? ""
        )}`;
        return !dbNameCityKeys.has(key);
      }),
      query: normalizedQuery,
      coords,
    });

    return { inNuzzle: inNuzzleSearchResults, morePlaces };
  }, [places, inNuzzleSearchResults, googleCandidates, normalizedQuery, coords]);

  const nuzzleBookmarkedPlaces = useMemo(
    () =>
      places
        .filter((place) => savedPlaceIds.has(place.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [places, savedPlaceIds]
  );

  const nuzzleUnbookmarkedPlaces = useMemo(
    () =>
      places
        .filter((place) => {
          if (savedPlaceIds.has(place.id)) return false;
          if (coords && place.latitude != null && place.longitude != null) {
            return (
              getDistanceMeters(coords.latitude, coords.longitude, place.latitude, place.longitude) <=
              NUZZLE_SECTION_UNBOOKMARKED_RADIUS_METERS
            );
          }
          return true;
        })
        .sort((a, b) => {
          if (
            coords &&
            a.latitude != null && a.longitude != null &&
            b.latitude != null && b.longitude != null
          ) {
            return (
              getDistanceMeters(coords.latitude, coords.longitude, a.latitude, a.longitude) -
              getDistanceMeters(coords.latitude, coords.longitude, b.latitude, b.longitude)
            );
          }
          return a.name.localeCompare(b.name);
        }),
    [places, savedPlaceIds, coords]
  );

  const nearbyPlacesQuery = useQuery({
    queryKey: [
      "nearbyGooglePlaces",
      coords ? `${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}` : "no-location",
    ],
    queryFn: () => getNearbyGooglePlaces({ latitude: coords!.latitude, longitude: coords!.longitude }),
    enabled: coords !== null && placesLocationState === "granted" && !hasActivePlaceSearch,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const dbGooglePlaceIds = useMemo(
    () => new Set(places.map((p) => p.google_place_id).filter(Boolean) as string[]),
    [places]
  );

  const dbPlaceNames = useMemo(
    () => new Set(places.map((p) => p.name.trim().toLowerCase())),
    [places]
  );

  const rankedNearbyCandidates = useMemo(
    () => {
      const raw = nearbyPlacesQuery.data ?? [];
      const filtered = raw.filter((c) => {
        if (dbGooglePlaceIds.has(c.googlePlaceId)) return false;
        const candidateName = c.name.trim().toLowerCase();
        for (const dbName of dbPlaceNames) {
          if (dbName.includes(candidateName) || candidateName.includes(dbName)) return false;
        }
        return true;
      });
      return rankNearbyCandidates(filtered, coords);
    },
    [nearbyPlacesQuery.data, coords, dbGooglePlaceIds, dbPlaceNames]
  );

  useEffect(() => {
    setNearbyDisplayCount(NEARBY_INITIAL_COUNT);
    setNuzzleUnbookmarkedDisplayCount(NUZZLE_UNBOOKMARKED_INITIAL_COUNT);
  }, [coords]);

  const handleGooglePlacePress = (candidate: GooglePlaceCandidate) => {
    navigation.navigate("GooglePlacePreview", {
      googlePlaceId: candidate.googlePlaceId,
      initialName: candidate.name,
    });
  };

  const scrollChromePadding = headerHeight + tabsSearchHeight;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        {/* Breeds tab */}
        {activeTab === "breeds" && (
          <ScrollView
            style={styles.container}
            contentContainerStyle={[
              styles.breedsContent,
              { paddingTop: scrollChromePadding + spacing.xl - 5 },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.gridWrap}>
              <View style={styles.grid}>
                {filteredPackItems.map((item) => (
                  <Pressable
                    key={item.breed}
                    style={[styles.cell, { width: cardWidth }]}
                    onPress={() => navigation.navigate("BreedFeed", { breed: item.breed })}
                  >
                    {({ pressed }) => (
                      <View style={styles.cardShadow}>
                        <ImageBackground
                          style={[styles.card, pressed && styles.pressed]}
                          imageStyle={[
                            styles.cardImage,
                            item.breed === "AUSTRALIAN_SHEPHERD" && styles.aussieCardImage,
                            item.breed === "DACHSHUND" && styles.dachshundCardImage,
                            item.breed === "FRENCH_BULLDOG" && styles.frenchieCardImage,
                            item.breed === "GERMAN_SHEPHERD" && styles.germanCardImage,
                            item.breed === "GOLDEN_DOODLE" && styles.goldenDoodleCardImage,
                            item.breed === "GOLDEN_RETRIEVER" && styles.goldenCardImage,
                            item.breed === "HUSKY" && styles.huskyCardImage,
                            item.breed === "MIXED_BREED" && styles.mixedBreedCardImage,
                            item.breed === "PUG" && styles.pugCardImage,
                            item.breed === "LABRADOODLE" && styles.labradoodleCardImage,
                            item.breed === "LABRADOR_RETRIEVER" && styles.labCardImage,
                            item.breed === "PIT_BULL" && styles.pitbullCardImage,
                          ]}
                          source={item.image}
                          resizeMode="cover"
                        >
                          <View style={styles.overlay} />
                          <Text
                            style={[
                              styles.cardLabel,
                              item.breed === "GERMAN_SHEPHERD" && styles.germanCardLabel,
                              item.breed === "GOLDEN_DOODLE" && styles.goldenDoodleCardLabel,
                            ]}
                            numberOfLines={item.breed === "GERMAN_SHEPHERD" ? 2 : 1}
                            adjustsFontSizeToFit={item.breed === "GOLDEN_DOODLE"}
                            minimumFontScale={0.8}
                          >
                            {item.breed === "AUSTRALIAN_SHEPHERD"
                              ? "Aussie"
                              : item.breed === "FRENCH_BULLDOG"
                                ? "Frenchie"
                                : item.breed === "GOLDEN_RETRIEVER"
                                  ? "Golden"
                                  : item.breed === "LABRADOR_RETRIEVER"
                                    ? "Labrador"
                                    : item.label}
                          </Text>
                        </ImageBackground>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
            {filteredPackItems.length === 0 ? (
              <Text style={styles.emptyStateText}>No breeds match “{searchQuery.trim()}”</Text>
            ) : (
              <Text style={styles.comingSoonText}>More breeds coming soon!</Text>
            )}
          </ScrollView>
        )}

        {/* Places tab */}
        {activeTab === "places" && (
          <ScrollView
            style={styles.container}
            contentContainerStyle={[
              styles.placesContent,
              { paddingTop: scrollChromePadding + spacing.xl - 5 },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {hasActivePlaceSearch ? (
              <>
                <View style={styles.googleSection}>
                  <Text style={styles.googleSectionTitle}>In Nuzzle</Text>
                  {searchBuckets.inNuzzle.length > 0 ? (
                    searchBuckets.inNuzzle.map((place) => (
                      <PlaceRow
                        key={place.id}
                        place={place}
                        variant="plain"
                        showTypeChip={false}
                        isSaved={savedPlaceIds.has(place.id)}
                        onPress={() => navigation.navigate("PlaceDetail", { placeId: place.id })}
                        onSaveToggle={() =>
                          toggleSave.mutate({ placeId: place.id, isSaved: savedPlaceIds.has(place.id) })
                        }
                        saveLoading={toggleSave.isPending}
                      />
                    ))
                  ) : (
                    <Text style={styles.placesEmptyText}>No places in Nuzzle match “{trimmedPlaceSearch}”.</Text>
                  )}
                </View>

                <View style={styles.googleSection}>
                  <Text style={styles.googleSectionTitle}>More Places</Text>
                  {shouldSearchGooglePlaces &&
                  (googlePlacesQuery.isFetching || debouncedPlaceSearch !== trimmedPlaceSearch) ? (
                    <View style={styles.googleStateRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.googleStateText}>Searching Google Places…</Text>
                    </View>
                  ) : googlePlacesQuery.isError ? (
                    <Text style={styles.placesEmptyText}>
                      {googlePlacesErrorMessage ?? "Couldn’t search Google Places. Try again in a moment."}
                    </Text>
                  ) : searchBuckets.morePlaces.length > 0 ? (
                    searchBuckets.morePlaces.map((candidate) => (
                      <GooglePlaceRow
                        key={candidate.googlePlaceId}
                        candidate={candidate}
                        onPress={() => handleGooglePlacePress(candidate)}
                      />
                    ))
                  ) : (
                    <Text style={styles.placesEmptyText}>
                      {shouldSearchGooglePlaces
                        ? `No additional places found for “${trimmedPlaceSearch}”.`
                        : "Keep typing to search more places."}
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <>
                <PlacesSection
                  title="On Nuzzle"
                  isEmpty={nuzzleBookmarkedPlaces.length === 0 && nuzzleUnbookmarkedPlaces.length === 0}
                  emptyMessage="No places in this area yet."
                >
                  {nuzzleBookmarkedPlaces.map((place) => (
                    <PlaceRow
                      key={place.id}
                      place={place}
                      variant="plain"
                      showTypeChip={false}
                      isSaved={savedPlaceIds.has(place.id)}
                      onPress={() => navigation.navigate("PlaceDetail", { placeId: place.id })}
                      onSaveToggle={() =>
                        toggleSave.mutate({ placeId: place.id, isSaved: savedPlaceIds.has(place.id) })
                      }
                      saveLoading={toggleSave.isPending}
                    />
                  ))}
                  {nuzzleUnbookmarkedPlaces.slice(0, nuzzleUnbookmarkedDisplayCount).map((place) => (
                    <PlaceRow
                      key={place.id}
                      place={place}
                      variant="plain"
                      showTypeChip={false}
                      isSaved={false}
                      onPress={() => navigation.navigate("PlaceDetail", { placeId: place.id })}
                      onSaveToggle={() =>
                        toggleSave.mutate({ placeId: place.id, isSaved: false })
                      }
                      saveLoading={toggleSave.isPending}
                    />
                  ))}
                  {nuzzleUnbookmarkedDisplayCount < nuzzleUnbookmarkedPlaces.length && (
                    <Pressable
                      onPress={() =>
                        setNuzzleUnbookmarkedDisplayCount((c) => c + NUZZLE_UNBOOKMARKED_LOAD_MORE_COUNT)
                      }
                    >
                      <Text style={styles.nearbyShowMoreText}>Show more places</Text>
                    </Pressable>
                  )}
                </PlacesSection>

                {coords ? (
                  <PlacesSection
                    title="Nearby"
                    isEmpty={
                      !nearbyPlacesQuery.isFetching &&
                      !nearbyPlacesQuery.isError &&
                      rankedNearbyCandidates.length === 0
                    }
                    emptyMessage="No nearby dog-friendly places found."
                  >
                    {nearbyPlacesQuery.isFetching ? (
                      <View style={styles.googleStateRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.googleStateText}>Finding nearby places…</Text>
                      </View>
                    ) : nearbyPlacesQuery.isError ? (
                      <Text style={styles.placesEmptyText}>
                        Couldn't load nearby places. Try again in a moment.
                      </Text>
                    ) : (
                      <>
                        {rankedNearbyCandidates.slice(0, nearbyDisplayCount).map((candidate) => (
                          <GooglePlaceRow
                            key={candidate.googlePlaceId}
                            candidate={candidate}
                            onPress={() => handleGooglePlacePress(candidate)}
                          />
                        ))}
                        {nearbyDisplayCount < rankedNearbyCandidates.length && (
                          <Pressable
                            onPress={() =>
                              setNearbyDisplayCount((c) => c + NEARBY_LOAD_MORE_COUNT)
                            }
                          >
                            <Text style={styles.nearbyShowMoreText}>Show more places</Text>
                          </Pressable>
                        )}
                      </>
                    )}
                  </PlacesSection>
                ) : placesLocationState === "denied" ? (
                  <Text style={styles.placesHintText}>
                    Enable location in Settings to show nearby places.
                  </Text>
                ) : null}

              </>
            )}
          </ScrollView>
        )}

        {/* Tabs + search overlay (hides on scroll down, shows on scroll up) */}
        <Animated.View
          style={[
            styles.tabsSearchOverlay,
            { top: headerHeight },
            tabsSearchAnimatedStyle,
          ]}
          onLayout={handleTabsSearchLayout}
        >
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tab, activeTab === "breeds" && styles.tabActive]}
              onPress={() => handleTabChange("breeds")}
            >
              <Text style={[styles.tabText, activeTab === "breeds" && styles.tabTextActive]}>
                Breeds
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === "places" && styles.tabActive]}
              onPress={() => handleTabChange("places")}
            >
              <Text style={[styles.tabText, activeTab === "places" && styles.tabTextActive]}>
                Places
              </Text>
            </Pressable>
          </View>
          <View style={styles.searchWrap}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={activeTab === "breeds" ? "Search breeds" : "Search places"}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="default"
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && Platform.OS !== "ios" ? (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
      <MyPlacesSheet
        visible={myPlacesOpen}
        onClose={() => setMyPlacesOpen(false)}
        places={savedPlaces}
        dogCounts={dogCounts}
        isLoading={savedPlacesLoading}
        onPlacePress={(place) => {
          navigation.navigate('PlaceDetail', { placeId: place.id });
        }}
        onCreateMeetupPress={(place) => {
          navigation.navigate('CreatePost', {
            initialType: 'MEETUP',
            initialPlaceId: place.id,
            initialPlaceName: place.name,
          });
        }}
      />
    </View>
  );
}

function GooglePlaceRow({
  candidate,
  onPress,
}: {
  candidate: GooglePlaceCandidate;
  onPress: () => void;
}) {
  const locationLine = [candidate.neighborhood, candidate.city]
    .filter(Boolean)
    .join(", ");
  const subtitle = locationLine || candidate.formattedAddress;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.googlePlaceRow,
        pressed && styles.googlePlaceRowPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Preview ${candidate.name}`}
    >
      <View style={styles.googlePlaceIconWrap}>
        <Ionicons name="chevron-forward" size={22} color={colors.primary} />
      </View>
      <View style={styles.googlePlaceBody}>
        <Text style={styles.googlePlaceName} numberOfLines={1}>
          {candidate.name}
        </Text>
        {subtitle ? (
          <Text style={styles.googlePlaceSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function PlacesSection({
  title,
  children,
  isEmpty,
  emptyMessage,
}: {
  title: string;
  children: React.ReactNode;
  isEmpty: boolean;
  emptyMessage: string;
}) {
  return (
    <View style={styles.googleSection}>
      <Text style={styles.googleSectionTitle}>{title}</Text>
      {isEmpty ? <Text style={styles.placesEmptyText}>{emptyMessage}</Text> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  safe: { flex: 1 },
  container: { flex: 1 },
  myPlacesChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: "relative",
    bottom: 2,
    left: 5,
  },
  myPlacesChipPressed: { opacity: 0.5 },

  header: {
    backgroundColor: colors.surface,
  },
  tabsSearchOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    zIndex: 5,
  },
  headerTitleText: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
    position: "relative",
    top: -2,
  },
  // Tab bar
  tabBar: {
    flexDirection: "row",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 1,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -1.5,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    fontFamily: "Inter_400Regular",
    color: colors.textMuted,
  },
  tabTextActive: {
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },

  // Search
  searchWrap: {
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.md,
    paddingBottom: 10,
  },
  searchRow: {
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    lineHeight: 19,
    color: colors.textPrimary,
    paddingVertical: 0,
    paddingTop: Platform.OS === "ios" ? 1 : 0,
    paddingBottom: Platform.OS === "ios" ? 2 : 0,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  emptyStateText: {
    ...typography.bodyMuted,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },

  // Breeds tab
  breedsContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.xl + 5,
    paddingBottom: spacing.xxxl + 75,
  },
  gridWrap: {
    alignItems: "center",
    marginLeft: 10,
  },
  comingSoonText: {
    ...typography.bodyMuted,
    textAlign: "center",
    marginTop: spacing.sm + 2,
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -CARD_GAP / 2,
  },
  cell: {
    paddingHorizontal: CARD_GAP / 2,
    marginBottom: spacing.lg,
  },
  card: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: spacing.md,
  },
  cardShadow: {
    borderRadius: radius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  cardImage: { borderRadius: radius.xl },
  aussieCardImage: {
    transform: [{ scale: 1.25 }, { translateX: 10 }, { translateY: -10 }],
  },
  dachshundCardImage: {
    transform: [{ scale: 1.4 }, { translateX: 10 }, { translateY: 18 }],
  },
  frenchieCardImage: {
    transform: [{ scale: 1.75 }, { translateX: 11 }, { translateY: -1 }],
  },
  germanCardImage: {
    transform: [{ scale: 1.35 }, { translateX: 9 }, { translateY: 7 }],
  },
  goldenCardImage: {
    transform: [{ scale: 1.3 }, { translateX: 10 }, { translateY: 5 }],
  },
  goldenDoodleCardImage: {
    transform: [{ scale: 1.25 }, { translateX: 12 }, { translateY: 6 }],
  },
  huskyCardImage: {
    transform: [{ scale: 1.6 }, { translateX: 5 }, { translateY: 12 }],
  },
  mixedBreedCardImage: {
    transform: [{ scale: 1.25 }, { translateX: 8 }, { translateY: 15 }],
  },
  pugCardImage: {
    transform: [{ scale: 1.21 }, { translateX: 11 }, { translateY: -2 }],
  },
  labCardImage: {
    transform: [{ scale: 1.4 }, { translateX: 7 }, { translateY: 11 }],
  },
  labradoodleCardImage: {
    transform: [{ scale: 1.35 }, { translateX: 8 }, { translateY: 5 }],
  },
  pitbullCardImage: {
    transform: [{ scale: 1.3 }, { translateX: 6 }, { translateY: 4 }],
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 45,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  cardLabel: {
    fontSize: 19,
    lineHeight: 20,
    letterSpacing: 0.4,
    ...Platform.select({
      ios: { fontFamily: "System", fontWeight: "700" as const },
      android: { fontFamily: "sans-serif", fontWeight: "700" as const },
      default: {
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontWeight: "700" as const,
      },
    }),
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 0.75 },
    textShadowRadius: 1.5,
    color: colors.surface,
    textAlign: "left",
    width: "100%",
    paddingLeft: 5,
    zIndex: 1,
  },
  germanCardLabel: {
    fontSize: 18,
    lineHeight: 18,
    position: "relative",
    top: 8,
  },
  goldenDoodleCardLabel: {
    fontSize: 17,
    lineHeight: 18,
    position: "relative",
    bottom: 1,
  },
  pressed: { opacity: 0.92 },

  // Places tab
  placesContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.xl + 5,
    paddingBottom: spacing.xxxl + 75,
    gap: spacing.sm,
  },
  placesEmptyText: {
    ...typography.bodyMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  placesHintText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  nearbyShowMoreText: {
    ...typography.body,
    color: colors.primary,
    textAlign: "center",
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  googleSection: {
    gap: spacing.sm,
  },
  googleSectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  googleStateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  googleStateText: {
    ...typography.bodyMuted,
  },
  googlePlaceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: -spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: "transparent",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md + 1,
  },
  googlePlaceRowPressed: {
    opacity: 0.9,
  },
  googlePlaceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    flexShrink: 0,
  },
  googlePlaceBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  googlePlaceName: {
    ...typography.subtitle,
  },
  googlePlaceSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
