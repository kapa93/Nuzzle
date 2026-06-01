import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { NotificationBell } from "@/components/NotificationBell";
import * as Location from "expo-location";
import { getDogSpotsNearby, getGooglePlacePhotoUrl } from "@/api/places";
import { useListDogSpotVibes } from "@/hooks/useDogSpotVibes";
import type { PlaceVibeData } from "@/hooks/useDogSpotVibes";
import { useUIStore } from "@/store/uiStore";
import { useLocationStore } from "@/store/locationStore";
import { colors, radius, spacing, typography } from "@/theme";
import { useStackHeaderHeight } from "@/hooks/useStackHeaderHeight";
import type { GooglePlaceCandidate } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const H_PADDING = spacing.lg;
const DOG_SPOTS_INITIAL_COUNT = 10;
const DOG_SPOTS_LOAD_MORE_COUNT = 10;
const MAX_LIST_VIBES = 3;

type DogSpotsFilter = "all" | "cafes" | "bars" | "breweries" | "restaurants" | "stores";

const DOG_SPOTS_FILTERS: DogSpotsFilter[] = ["all", "cafes", "bars", "breweries", "restaurants", "stores"];
const DOG_SPOTS_FILTER_LABELS: Record<DogSpotsFilter, string> = {
  all: "All",
  cafes: "Cafes",
  bars: "Bars",
  breweries: "Breweries",
  restaurants: "Restaurants",
  stores: "Stores",
};
const DOG_SPOTS_FILTER_TYPES: Record<Exclude<DogSpotsFilter, "all">, string[]> = {
  cafes: ["cafe", "coffee_shop", "bakery", "dog_cafe"],
  bars: ["bar", "pub", "night_club"],
  breweries: ["brewery"],
  restaurants: ["restaurant", "food"],
  stores: ["pet_store", "store"],
};

type UserCoords = { latitude: number; longitude: number } | null;
type PlacesLocationState = "unknown" | "granted" | "denied" | "error";

// ── Helpers ───────────────────────────────────────────────────────────────────

const GOOGLE_PLACE_TYPE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  dog_beach: "water-outline",
  dog_park: "paw-outline",
  trail: "leaf-outline",
  park: "leaf-outline",
  other: "location-outline",
};

const IGNORED_TYPES = new Set([
  "establishment", "point_of_interest", "food", "premise", "geocode", "subpremise",
]);

function formatPrimaryType(types: string[]): string {
  const first = types.find((t) => !IGNORED_TYPES.has(t));
  if (!first) return "";
  return first.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceMi(km: number): string {
  const mi = km * 0.621371;
  return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
}

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

// ── Sub-components ────────────────────────────────────────────────────────────

function DogSpotRow({
  candidate,
  coords,
  vibeData,
  onPress,
}: {
  candidate: GooglePlaceCandidate;
  coords: UserCoords;
  vibeData: PlaceVibeData | undefined;
  onPress: () => void;
}) {
  const primaryType = formatPrimaryType(candidate.types);
  const location    = candidate.neighborhood ?? candidate.city;
  const subtitle    = [primaryType, location].filter(Boolean).join(" • ");

  const distanceLine =
    coords && candidate.latitude != null && candidate.longitude != null
      ? formatDistanceMi(haversineKm(coords.latitude, coords.longitude, candidate.latitude, candidate.longitude))
      : null;

  const ratingStr =
    candidate.rating != null
      ? `${candidate.rating.toFixed(1)}${candidate.userRatingCount != null ? ` (${candidate.userRatingCount.toLocaleString()})` : ""}`
      : null;
  const metaLine = [ratingStr, distanceLine].filter(Boolean).join("  •  ");

  const vibesWithCounts  = vibeData?.vibesWithCounts  ?? [];
  const uniqueVoterCount = vibeData?.uniqueVoterCount ?? 0;
  const shownVibes       = vibesWithCounts.slice(0, MAX_LIST_VIBES);
  const extraCount       = vibesWithCounts.length - shownVibes.length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.dogSpotCard, pressed && styles.dogSpotCardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Preview ${candidate.name}`}
    >
      {/* Thumbnail */}
      {candidate.coverPhotoName ? (
        <Image
          source={{ uri: getGooglePlacePhotoUrl(candidate.coverPhotoName) }}
          style={styles.dogSpotThumb}
        />
      ) : (
        <View style={[styles.dogSpotThumb, styles.dogSpotThumbFallback]}>
          <Ionicons name={getGooglePlaceIcon(candidate)} size={24} color={colors.primary} />
        </View>
      )}

      {/* Body */}
      <View style={styles.dogSpotBody}>
        <Text style={styles.dogSpotName} numberOfLines={2}>
          {candidate.name}
        </Text>

        {subtitle ? (
          <Text style={styles.dogSpotSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}

        {metaLine ? (
          <View style={styles.dogSpotMetaRow}>
            {ratingStr ? <Ionicons name="star" size={12} color="#F5A623" /> : null}
            <Text style={styles.dogSpotMetaText}>{metaLine}</Text>
          </View>
        ) : null}

        {shownVibes.length > 0 && (
          <View style={styles.dogSpotVibeRow}>
            {shownVibes.map((vibe) => {
              const iconName = vibe.icon as React.ComponentProps<typeof Ionicons>["name"] | null;
              return (
                <View key={vibe.id} style={styles.dogSpotVibeChip}>
                  {iconName ? <Ionicons name={iconName} size={12} color={colors.primary} /> : null}
                  <Text style={styles.dogSpotVibeLabel}>{vibe.label}</Text>
                  <Text style={styles.dogSpotVibeCount}>{vibe.count}</Text>
                </View>
              );
            })}
            {extraCount > 0 && (
              <Text style={styles.dogSpotVibeMore}>+{extraCount} more</Text>
            )}
          </View>
        )}

        {uniqueVoterCount > 0 && (
          <View style={styles.dogSpotApprovedRow}>
            <Ionicons name="paw" size={12} color={colors.primary} />
            <Text style={styles.dogSpotApprovedText}>
              Dog approved by {uniqueVoterCount} {uniqueVoterCount === 1 ? "local" : "locals"}
            </Text>
          </View>
        )}
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
  style?: import("react-native").ViewStyle;
}) {
  return (
    <View style={[styles.googleSection, style]}>
      <Text style={styles.googleSectionTitle}>{title}</Text>
      {isEmpty ? <Text style={styles.placesEmptyText}>{emptyMessage}</Text> : children}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function ExploreScreen({
  navigation,
}: {
  navigation: { navigate: (s: string, p?: object) => void; setOptions: (opts: object) => void };
}) {
  const headerHeight = useStackHeaderHeight();
  const showLocationModal = useUIStore((s) => s.showLocationModal);
  const locationSetupVersion = useLocationStore((s) => s.locationSetupVersion);
  const [coords, setCoords] = useState<UserCoords>(null);
  const [placesLocationState, setPlacesLocationState] = useState<PlacesLocationState>("unknown");
  const [dogSpotsDisplayCount, setDogSpotsDisplayCount] = useState(DOG_SPOTS_INITIAL_COUNT);
  const [dogSpotsFilter, setDogSpotsFilter] = useState<DogSpotsFilter>("all");

  React.useEffect(() => {
    navigation.setOptions({
      headerLeft: () => <NotificationBell />,
    });
  }, [navigation]);

  const dogSpotsQuery = useQuery({
    queryKey: [
      "dogSpots",
      coords ? `${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}` : "no-location",
    ],
    queryFn: () =>
      getDogSpotsNearby({ latitude: coords!.latitude, longitude: coords!.longitude }),
    enabled: coords !== null && placesLocationState === "granted",
    staleTime: 5 * 60_000,
    retry: false,
  });

  useEffect(() => {
    let cancelled = false;

    const loadLocation = async () => {
      let permissionGranted = false;
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        const status = permission.status;

        if (status !== "granted") {
          if (!cancelled) {
            const { manualLocation, hasSeenLocationModal } = useLocationStore.getState();
            if (manualLocation) {
              setCoords({ latitude: manualLocation.latitude, longitude: manualLocation.longitude });
              setPlacesLocationState("granted");
            } else {
              setCoords(null);
              setPlacesLocationState("denied");
              if (!hasSeenLocationModal) {
                useUIStore.getState().showLocationModal();
              }
            }
          }
          return;
        }

        permissionGranted = true;

        // Accuracy.High forces the GPS provider on Android, which picks up
        // mock locations set via emulator Extended Controls.
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
  // locationSetupVersion bumps after the modal completes (GPS granted or manual set),
  // causing this effect to re-run and pick up the new location.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSetupVersion]);

  useEffect(() => {
    setDogSpotsDisplayCount(DOG_SPOTS_INITIAL_COUNT);
    setDogSpotsFilter("all");
  }, [coords]);

  useEffect(() => {
    setDogSpotsDisplayCount(DOG_SPOTS_INITIAL_COUNT);
  }, [dogSpotsFilter]);

  const filteredDogSpots = useMemo(() => {
    const raw = dogSpotsQuery.data ?? [];
    if (dogSpotsFilter === "all") return raw;
    const allowedTypes = new Set(DOG_SPOTS_FILTER_TYPES[dogSpotsFilter]);
    return raw.filter((c) => c.types.some((t) => allowedTypes.has(t.toLowerCase())));
  }, [dogSpotsQuery.data, dogSpotsFilter]);

  const visibleSpotIds = useMemo(
    () => filteredDogSpots.slice(0, dogSpotsDisplayCount).map((c) => c.googlePlaceId),
    [filteredDogSpots, dogSpotsDisplayCount],
  );

  const { vibesByPlace } = useListDogSpotVibes(visibleSpotIds);

  const handleDogSpotPress = (candidate: GooglePlaceCandidate) => {
    navigation.navigate("DogSpotPreview", {
      googlePlaceId: candidate.googlePlaceId,
      initialName: candidate.name,
    });
  };

  const isFullScreenLoading =
    placesLocationState === "unknown" || dogSpotsQuery.isLoading;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        {isFullScreenLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.googleStateText}>Finding dog-friendly spots…</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={[
              styles.content,
              { paddingTop: headerHeight + spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {coords ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dogSpotsChipScroll}
                  contentContainerStyle={styles.dogSpotsChipRow}
                >
                  {DOG_SPOTS_FILTERS.map((filter) => {
                    const isActive = dogSpotsFilter === filter;
                    return (
                      <Pressable
                        key={filter}
                        onPress={() => setDogSpotsFilter(filter)}
                        style={({ pressed }) => [
                          styles.dogSpotsChip,
                          isActive && styles.dogSpotsChipActive,
                          pressed && styles.dogSpotsChipPressed,
                        ]}
                      >
                        {filter === "all" && (
                          <Ionicons
                            name="paw"
                            size={13}
                            color={isActive ? colors.surface : colors.primary}
                            style={styles.dogSpotsChipIcon}
                          />
                        )}
                        <Text
                          style={[
                            styles.dogSpotsChipText,
                            isActive && styles.dogSpotsChipTextActive,
                          ]}
                        >
                          {DOG_SPOTS_FILTER_LABELS[filter]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <PlacesSection
                  title="Dog-Friendly Spots Nearby"
                  isEmpty={!dogSpotsQuery.isError && filteredDogSpots.length === 0}
                  emptyMessage={
                    dogSpotsFilter === "all"
                      ? "No dog-friendly spots found nearby."
                      : `No ${DOG_SPOTS_FILTER_LABELS[dogSpotsFilter].toLowerCase()} found nearby.`
                  }
                >
                  {dogSpotsQuery.isError ? (
                    <Text style={styles.placesEmptyText}>
                      Couldn't load dog-friendly spots. Try again in a moment.
                    </Text>
                  ) : (
                    <>
                      {filteredDogSpots.slice(0, dogSpotsDisplayCount).map((candidate) => (
                        <DogSpotRow
                          key={candidate.googlePlaceId}
                          candidate={candidate}
                          coords={coords}
                          vibeData={vibesByPlace.get(candidate.googlePlaceId)}
                          onPress={() => handleDogSpotPress(candidate)}
                        />
                      ))}
                      {dogSpotsDisplayCount < filteredDogSpots.length && (
                        <Pressable
                          onPress={() =>
                            setDogSpotsDisplayCount((c) => c + DOG_SPOTS_LOAD_MORE_COUNT)
                          }
                        >
                          <Text style={styles.nearbyShowMoreText}>Show more spots</Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </PlacesSection>
              </>
            ) : (
              <View style={styles.locationEmptyState}>
                <Ionicons name="location-outline" size={40} color={colors.primary} style={styles.locationEmptyIcon} />
                <Text style={styles.locationEmptyTitle}>Set a location to find dog-friendly spots</Text>
                <Text style={styles.locationEmptyBody}>
                  Nuzzle uses your location to show nearby parks, cafes, breweries, and more that welcome dogs.
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.locationEmptyBtn,
                    pressed && styles.locationEmptyBtnPressed,
                  ]}
                  onPress={showLocationModal}
                  accessibilityRole="button"
                >
                  <Text style={styles.locationEmptyBtnText}>Set Location</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  safe: { flex: 1 },
  container: { flex: 1 },

  bellIcon: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: "relative",
    bottom: 1,
    left: 5,
    transform: [{ translateX: 1 }],
  },
  bellIconPressed: { opacity: 0.5 },
  content: {
    paddingHorizontal: H_PADDING,
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
  locationEmptyState: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  locationEmptyIcon: {
    marginBottom: spacing.md,
    opacity: 0.75,
  },
  locationEmptyTitle: {
    ...typography.subtitle,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  locationEmptyBody: {
    ...typography.bodyMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  locationEmptyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  locationEmptyBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  locationEmptyBtnText: {
    ...typography.body,
    color: colors.surface,
  },
  nearbyShowMoreText: {
    ...typography.body,
    color: colors.primary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    textAlign: "center",
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: -5,
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
  loadingContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  googleStateText: {
    ...typography.bodyMuted,
  },

  dogSpotsChipScroll: {
    marginHorizontal: -H_PADDING,
  },
  dogSpotsChipRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: H_PADDING,
    paddingBottom: spacing.sm,
  },
  dogSpotsChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dogSpotsChipPressed: { opacity: 0.85 },
  dogSpotsChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dogSpotsChipIcon: { marginRight: spacing.xxs + 1 },
  dogSpotsChipText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  dogSpotsChipTextActive: { color: colors.surface },

  // ── Dog spot card
  dogSpotCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1.25,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  dogSpotCardPressed: { opacity: 0.88 },
  dogSpotThumb: {
    width: 90,
    height: 90,
    borderRadius: radius.xs,
    flexShrink: 0,
    backgroundColor: colors.surfaceMuted,
  },
  dogSpotThumbFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  dogSpotBody: {
    flex: 1,
    gap: spacing.xxs + 1,
  },
  dogSpotName: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: -3,
  },
  dogSpotSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dogSpotMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dogSpotMetaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dogSpotVibeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxs + 1,
    marginTop: spacing.xxs,
  },
  dogSpotVibeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dogSpotVibeLabel: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  dogSpotVibeCount: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  dogSpotVibeMore: {
    ...typography.caption,
    color: colors.textMuted,
    alignSelf: "center",
  },
  dogSpotApprovedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs + 1,
    marginTop: 1,
  },
  dogSpotApprovedText: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});
