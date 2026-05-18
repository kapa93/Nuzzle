import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { listActivePlaces, getNearbyGooglePlaces, getGooglePlacePhotoUrl } from "@/api/places";
import { PlaceRow } from "@/components/PlaceRow";
import { useSavedPlaces, useToggleSavedPlace } from "@/hooks/useSavedPlaces";
import { useAuthStore } from "@/store/authStore";
import { getDistanceMeters } from "@/utils/location";
import { getPlaceHeroImage } from "@/utils/placeHeroImage";
import { colors, spacing, typography, radius } from "@/theme";
import type { GooglePlaceCandidate, Place } from "@/types";

// ── Constants ────────────────────────────────────────────────────────────────

const NEARBY_INITIAL_COUNT = 5;
const NEARBY_LOAD_MORE_COUNT = 5;
const NEARBY_PROXIMITY_DEDUP_THRESHOLD_METERS = 50;
const NUZZLE_SECTION_UNBOOKMARKED_RADIUS_METERS = 100_000;
const NUZZLE_UNBOOKMARKED_INITIAL_COUNT = 5;
const NUZZLE_UNBOOKMARKED_LOAD_MORE_COUNT = 5;

type UserCoords = { latitude: number; longitude: number } | null;
type PlacesLocationState = "unknown" | "granted" | "denied" | "error";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPlaceImageSource(
  place: Place,
  accessToken: string | null
): ImageSourcePropType | null {
  const bundled = getPlaceHeroImage(place);
  if (bundled) return bundled;
  if (place.photos[0] && accessToken) {
    return { uri: getGooglePlacePhotoUrl(place.photos[0], accessToken) };
  }
  return null;
}

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
    const aDog = hasDog(a) ? 1 : 0;
    const bDog = hasDog(b) ? 1 : 0;
    if (aDog !== bDog) return bDog - aDog;
    return nearbyScore(b, coords) - nearbyScore(a, coords);
  });

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
      const preferCandidate =
        candidateHasDog !== existingHasDog
          ? candidateHasDog
          : candidate.name.length > existing.name.length;
      if (preferCandidate) kept[dupIndex] = candidate;
    }
  }

  const seenNames = new Set<string>();
  return kept.filter((c) => {
    const key = c.name.trim().toLowerCase();
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });
}

const GOOGLE_PLACE_TYPE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  dog_beach: "water-outline",
  dog_park: "paw-outline",
  trail: "leaf-outline",
  park: "leaf-outline",
  other: "location-outline",
};

function getGooglePlaceIcon(
  candidate: GooglePlaceCandidate
): React.ComponentProps<typeof Ionicons>["name"] {
  const lower = candidate.name.toLowerCase();
  if (lower.includes("beach")) return "water-outline";
  if (lower.includes("trail") || lower.includes("hike") || lower.includes("hiking"))
    return "leaf-outline";
  if (lower.includes("park") || lower.includes("dog park")) return "paw-outline";
  return GOOGLE_PLACE_TYPE_ICONS[candidate.placeType] ?? "location-outline";
}

// ── Sub-components ───────────────────────────────────────────────────────────

function GooglePlaceRow({
  candidate,
  onPress,
}: {
  candidate: GooglePlaceCandidate;
  onPress: () => void;
}) {
  const locationLine = [candidate.neighborhood, candidate.city].filter(Boolean).join(", ");
  const subtitle = locationLine || candidate.formattedAddress;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.googlePlaceRow, pressed && styles.googlePlaceRowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Preview ${candidate.name}`}
    >
      <View style={styles.googlePlaceIconWrap}>
        <Ionicons name={getGooglePlaceIcon(candidate)} size={22} color={colors.primary} />
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
  style,
}: {
  title: string;
  children: React.ReactNode;
  isEmpty: boolean;
  emptyMessage: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.googleSection, style]}>
      <Text style={styles.googleSectionTitle}>{title}</Text>
      {isEmpty ? <Text style={styles.placesEmptyText}>{emptyMessage}</Text> : children}
    </View>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

type Props = {
  headerHeight: number;
  placesTabBarHeight: number;
  photoAccessToken: string | null;
  onPlacePress: (placeId: string) => void;
  onGooglePlacePress: (googlePlaceId: string, initialName?: string) => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export function MorePlacesTab({
  headerHeight,
  placesTabBarHeight,
  photoAccessToken,
  onPlacePress,
  onGooglePlacePress,
  onScroll,
}: Props) {
  const { user } = useAuthStore();
  const [coords, setCoords] = useState<UserCoords>(null);
  const [placesLocationState, setPlacesLocationState] = useState<PlacesLocationState>("unknown");
  const [nearbyDisplayCount, setNearbyDisplayCount] = useState(NEARBY_INITIAL_COUNT);
  const [nuzzleDisplayCount, setNuzzleDisplayCount] = useState(NUZZLE_UNBOOKMARKED_INITIAL_COUNT);
  const hasRequestedPermissionRef = useRef(false);

  const { data: places = [] } = useQuery({
    queryKey: ["places"],
    queryFn: listActivePlaces,
    enabled: !!user?.id,
  });

  const { savedPlaceIds } = useSavedPlaces(user?.id);
  const toggleSave = useToggleSavedPlace();

  const nearbyPlacesQuery = useQuery({
    queryKey: [
      "nearbyGooglePlaces",
      coords ? `${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}` : "no-location",
    ],
    queryFn: () => getNearbyGooglePlaces({ latitude: coords!.latitude, longitude: coords!.longitude }),
    enabled: coords !== null && placesLocationState === "granted",
    staleTime: 5 * 60_000,
    retry: false,
  });

  // Location permission + coords
  useEffect(() => {
    let cancelled = false;

    const loadLocation = async () => {
      let permissionGranted = false;
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        let status = permission.status;

        if (status !== "granted" && !hasRequestedPermissionRef.current) {
          hasRequestedPermissionRef.current = true;
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

        permissionGranted = true;

        let position: Location.LocationObject | null = null;
        try {
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
        } catch {
          position = await Location.getLastKnownPositionAsync();
        }

        if (!position) throw new Error("Could not determine location");

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
          setPlacesLocationState(permissionGranted ? "error" : "denied");
        }
      }
    };

    loadLocation();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset pagination when location changes
  useEffect(() => {
    setNearbyDisplayCount(NEARBY_INITIAL_COUNT);
    setNuzzleDisplayCount(NUZZLE_UNBOOKMARKED_INITIAL_COUNT);
  }, [coords]);

  const nuzzlePlaces = useMemo(
    () =>
      places
        .filter((place) => {
          if (coords && place.latitude != null && place.longitude != null) {
            return (
              getDistanceMeters(
                coords.latitude,
                coords.longitude,
                place.latitude,
                place.longitude
              ) <= NUZZLE_SECTION_UNBOOKMARKED_RADIUS_METERS
            );
          }
          return true;
        })
        .sort((a, b) => {
          if (
            coords &&
            a.latitude != null &&
            a.longitude != null &&
            b.latitude != null &&
            b.longitude != null
          ) {
            return (
              getDistanceMeters(coords.latitude, coords.longitude, a.latitude, a.longitude) -
              getDistanceMeters(coords.latitude, coords.longitude, b.latitude, b.longitude)
            );
          }
          return a.name.localeCompare(b.name);
        }),
    [places, coords]
  );

  const dbGooglePlaceIds = useMemo(
    () => new Set(places.map((p) => p.google_place_id).filter(Boolean) as string[]),
    [places]
  );

  const dbPlaceNames = useMemo(
    () => new Set(places.map((p) => p.name.trim().toLowerCase())),
    [places]
  );

  const rankedNearbyCandidates = useMemo(() => {
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
  }, [nearbyPlacesQuery.data, coords, dbGooglePlaceIds, dbPlaceNames]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.placesContent,
        { paddingTop: headerHeight + placesTabBarHeight + spacing.xl + 1 },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <PlacesSection
        title="Explore local feeds or suggest a new one"
        isEmpty={nuzzlePlaces.length === 0}
        emptyMessage="No places in this area yet."
      >
        {nuzzlePlaces.slice(0, nuzzleDisplayCount).map((place) => (
          <PlaceRow
            key={place.id}
            place={place}
            variant="plain"
            showTypeChip={false}
            heroImageSource={getPlaceImageSource(place, photoAccessToken)}
            isSaved={savedPlaceIds.has(place.id)}
            onPress={() => onPlacePress(place.id)}
            onSaveToggle={() =>
              toggleSave.mutate({ placeId: place.id, isSaved: savedPlaceIds.has(place.id) })
            }
            saveLoading={toggleSave.isPending}
          />
        ))}
        {nuzzleDisplayCount < nuzzlePlaces.length && (
          <Pressable
            onPress={() => setNuzzleDisplayCount((c) => c + NUZZLE_UNBOOKMARKED_LOAD_MORE_COUNT)}
          >
            <Text style={styles.nearbyShowMoreText}>Show more places</Text>
          </Pressable>
        )}
      </PlacesSection>

      {coords ? (
        <PlacesSection
          title="Nearby"
          style={{ marginTop: spacing.md }}
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
                  onPress={() => onGooglePlacePress(candidate.googlePlaceId, candidate.name)}
                />
              ))}
              {nearbyDisplayCount < rankedNearbyCandidates.length && (
                <Pressable
                  onPress={() => setNearbyDisplayCount((c) => c + NEARBY_LOAD_MORE_COUNT)}
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
      ) : placesLocationState === "error" ? (
        <Text style={styles.placesHintText}>
          Couldn't get your location. Check your connection and try again.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placesContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl + 65,
    gap: spacing.sm,
  },
  googleSection: {
    gap: spacing.sm,
  },
  googleSectionTitle: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    textAlign: "center",
    fontFamily: 'Inter_500Medium',
    marginBottom: spacing.sm + 1,
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
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
    textAlign: "center",
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
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
