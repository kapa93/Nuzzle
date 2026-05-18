import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Bell } from "lucide-react-native";
import * as Location from "expo-location";
import { getDogSpotsNearby, getGooglePlacePhotoUrl } from "@/api/places";
import { NotificationsSheet } from "@/components/NotificationsSheet";
import { colors, radius, spacing, typography } from "@/theme";
import { useStackHeaderHeight } from "@/hooks/useStackHeaderHeight";
import type { GooglePlaceCandidate } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const H_PADDING = spacing.lg;
const DOG_SPOTS_INITIAL_COUNT = 10;
const DOG_SPOTS_LOAD_MORE_COUNT = 10;

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
      {candidate.coverPhotoName ? (
        <Image
          source={{ uri: getGooglePlacePhotoUrl(candidate.coverPhotoName) }}
          style={styles.dogSpotThumb}
        />
      ) : (
        <View style={[styles.googlePlaceIconWrap, styles.dogSpotThumbFallback]}>
          <Ionicons name={getGooglePlaceIcon(candidate)} size={22} color={colors.primary} />
        </View>
      )}
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
  const [coords, setCoords] = useState<UserCoords>(null);
  const [placesLocationState, setPlacesLocationState] = useState<PlacesLocationState>("unknown");
  const [dogSpotsDisplayCount, setDogSpotsDisplayCount] = useState(DOG_SPOTS_INITIAL_COUNT);
  const [dogSpotsFilter, setDogSpotsFilter] = useState<DogSpotsFilter>("all");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const hasRequestedPermissionRef = useRef(false);

  React.useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={() => setNotificationsOpen(true)}
          style={({ pressed }) => [styles.bellIcon, pressed && styles.bellIconPressed]}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={24} color="#000000" />
        </Pressable>
      ),
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
  }, []);

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

  const handleDogSpotPress = (candidate: GooglePlaceCandidate) => {
    navigation.navigate("DogSpotPreview", {
      googlePlaceId: candidate.googlePlaceId,
      initialName: candidate.name,
    });
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
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
                contentContainerStyle={styles.dogSpotsChipRow}
              >
                {DOG_SPOTS_FILTERS.map((filter) => (
                  <Pressable
                    key={filter}
                    onPress={() => setDogSpotsFilter(filter)}
                    style={({ pressed }) => [
                      styles.dogSpotsChip,
                      dogSpotsFilter === filter && styles.dogSpotsChipActive,
                      pressed && styles.dogSpotsChipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dogSpotsChipText,
                        dogSpotsFilter === filter && styles.dogSpotsChipTextActive,
                      ]}
                    >
                      {DOG_SPOTS_FILTER_LABELS[filter]}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <PlacesSection
                title="Dog-Friendly Spots Nearby"
                isEmpty={
                  !dogSpotsQuery.isFetching &&
                  !dogSpotsQuery.isError &&
                  filteredDogSpots.length === 0
                }
                emptyMessage={
                  dogSpotsFilter === "all"
                    ? "No dog-friendly spots found nearby."
                    : `No ${DOG_SPOTS_FILTER_LABELS[dogSpotsFilter].toLowerCase()} found nearby.`
                }
              >
                {dogSpotsQuery.isFetching ? (
                  <View style={styles.googleStateRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.googleStateText}>Finding dog-friendly spots…</Text>
                  </View>
                ) : dogSpotsQuery.isError ? (
                  <Text style={styles.placesEmptyText}>
                    Couldn't load dog-friendly spots. Try again in a moment.
                  </Text>
                ) : (
                  <>
                    {filteredDogSpots.slice(0, dogSpotsDisplayCount).map((candidate) => (
                      <DogSpotRow
                        key={candidate.googlePlaceId}
                        candidate={candidate}
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
          ) : placesLocationState === "denied" ? (
            <Text style={styles.placesHintText}>
              Enable location in Settings to show dog-friendly spots nearby.
            </Text>
          ) : placesLocationState === "error" ? (
            <Text style={styles.placesHintText}>
              Couldn't get your location. Check your connection and try again.
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
      <NotificationsSheet
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onPostPress={(postId) => navigation.navigate("PostDetail", { postId })}
      />
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

  dogSpotsChipRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  dogSpotsChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dogSpotsChipPressed: { opacity: 0.85 },
  dogSpotsChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dogSpotsChipText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  dogSpotsChipTextActive: { color: colors.surface },

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
  googlePlaceRowPressed: { opacity: 0.9 },
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
  dogSpotThumb: {
    width: 80,
    height: 72,
    borderRadius: radius.sm,
    marginRight: spacing.md,
    flexShrink: 0,
    backgroundColor: colors.surfaceMuted,
  },
  dogSpotThumbFallback: {
    width: 80,
    height: 72,
    borderRadius: radius.sm,
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
