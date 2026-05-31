import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MapPin } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { listActivePlaces, listPendingPlacesWithInterests, getNearbyGooglePlaces, getGooglePlacePhotoUrl } from "@/api/places";
import { markCommunityInterest, removeCommunityInterest } from "@/api/communityInterests";
import { PlaceRow } from "@/components/PlaceRow";
import { useSavedPlaces, useToggleSavedPlace } from "@/hooks/useSavedPlaces";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { getDistanceMeters } from "@/utils/location";
import { getPlaceHeroImage } from "@/utils/placeHeroImage";
import { colors, spacing, typography, radius, shadow } from "@/theme";
import type { GooglePlaceCandidate, PendingPlaceWithInterests, Place } from "@/types";

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
  if (place.photos[0]) {
    return { uri: getGooglePlacePhotoUrl(place.photos[0]) };
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

const AVATAR_DISPLAY_COUNT = 4;

function PendingPlaceRow({
  place,
  photoAccessToken,
  userId,
  onPress,
  onCountMeIn,
  countMeInLoading,
}: {
  place: PendingPlaceWithInterests;
  photoAccessToken: string | null;
  userId: string | null;
  onPress: () => void;
  onCountMeIn: (isInterested: boolean) => void;
  countMeInLoading: boolean;
}) {
  const imageSource = getPlaceImageSource(place, photoAccessToken);
  const interestCount = place.interests.length;
  const isInterested = userId ? place.interests.some((i) => i.user_id === userId) : false;
  const visibleInterests = place.interests.slice(0, AVATAR_DISPLAY_COUNT);
  const extraCount = Math.max(0, interestCount - AVATAR_DISPLAY_COUNT);
  const interestLabel =
    interestCount === 1 ? "1 dog owner interested" : `${interestCount} dog owners interested`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pendingCard, pressed && styles.pendingCardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`View pending community for ${place.name}`}
    >
      {/* Main row: image | content | button */}
      <View style={styles.pendingCardMain}>
        {imageSource ? (
          <View style={styles.pendingThumbWrap}>
            <Image source={imageSource} style={styles.pendingThumb} />
          </View>
        ) : (
          <View style={[styles.pendingThumbWrap, styles.pendingThumbFallback]}>
            <Ionicons name="time-outline" size={20} color={colors.warningText} />
          </View>
        )}

        {/* Column 2: name + interest + description */}
        <View style={styles.pendingCardContent}>
          <Text style={styles.pendingCardName} numberOfLines={1}>
            {place.name}
          </Text>
          {interestCount > 0 && (
            <View style={styles.pendingInterestRow}>
              <Ionicons name="people-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.pendingInterestText}>{interestLabel}</Text>
            </View>
          )}
          <Text style={styles.pendingDescription}>
            Launching soon with enough local interest!
          </Text>
        </View>

      </View>

      {/* Bottom row: avatars (left) + Count Me In button (right) */}
      <View style={styles.pendingBottomRow}>
        <View style={styles.pendingAvatarRow}>
          {visibleInterests.map((interest) =>
            interest.profile_image_url ? (
              <Image
                key={interest.user_id}
                source={{ uri: interest.profile_image_url }}
                style={styles.pendingAvatar}
              />
            ) : (
              <View key={interest.user_id} style={[styles.pendingAvatar, styles.pendingAvatarFallback]}>
                <Ionicons name="person" size={15} color={colors.pendingText} />
              </View>
            )
          )}
          {extraCount > 0 && (
            <Text style={styles.pendingAvatarExtra}>+{extraCount} more</Text>
          )}
        </View>
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onCountMeIn(isInterested); }}
          disabled={countMeInLoading}
          style={[styles.countMeInButton, isInterested && styles.countMeInButtonDone]}
          accessibilityRole="button"
          accessibilityLabel={isInterested ? "Remove interest" : "Count me in"}
        >
          {countMeInLoading ? (
            <ActivityIndicator size="small" color={colors.pendingText} />
          ) : isInterested ? (
            <Text style={[styles.countMeInText, styles.countMeInTextDone]}>
              Interested ✓
            </Text>
          ) : (
            <View style={styles.countMeInButtonContent}>
              <Text style={styles.countMeInText}>I'm interested</Text>
              <Ionicons name="paw" size={12} color={colors.pendingText} />
            </View>
          )}
        </Pressable>
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

// ── Nearby Sheet ─────────────────────────────────────────────────────────────

type NearbySheetProps = {
  visible: boolean;
  onClose: () => void;
  candidates: GooglePlaceCandidate[];
  isLoading: boolean;
  isError: boolean;
  onGooglePlacePress: (googlePlaceId: string, initialName?: string) => void;
};

function NearbySheet({
  visible,
  onClose,
  candidates,
  isLoading,
  isError,
  onGooglePlacePress,
}: NearbySheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const sheetHeightRef = useRef(900);
  const slideAnim = useRef(new Animated.Value(900)).current;

  const startSlideOut = useCallback(
    (onDone?: () => void) => {
      Animated.timing(slideAnim, {
        toValue: sheetHeightRef.current,
        duration: 220,
        useNativeDriver: true,
      }).start(onDone);
    },
    [slideAnim]
  );

  const handleModalShow = useCallback(() => {
    slideAnim.setValue(sheetHeightRef.current);
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 22,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleClose = useCallback(() => {
    startSlideOut(onClose);
  }, [startSlideOut, onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) slideAnim.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 || gs.vy > 0.5) {
          startSlideOut(onClose);
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            damping: 22,
            stiffness: 220,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(sheetHeightRef.current);
      setQuery("");
    }
  }, [visible, slideAnim]);

  const filtered = useMemo(() => {
    if (!query.trim()) return candidates;
    const lower = query.toLowerCase();
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        (c.formattedAddress ?? "").toLowerCase().includes(lower)
    );
  }, [candidates, query]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onShow={handleModalShow}
      onRequestClose={handleClose}
    >
      <View style={sheetStyles.overlay}>
        <Pressable
          style={sheetStyles.backdrop}
          onPress={handleClose}
          accessibilityLabel="Close nearby places"
        />

        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) sheetHeightRef.current = h;
          }}
          style={[
            sheetStyles.nearbyPlacesSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={sheetStyles.handleArea} {...panResponder.panHandlers}>
            <View style={sheetStyles.handle} />
          </View>

          <View style={sheetStyles.sheetHeader}>
            <Text style={sheetStyles.sheetTitle}>Nearby Places</Text>
          </View>

          <View style={sheetStyles.searchRow}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} style={sheetStyles.searchIcon} />
            <TextInput
              style={sheetStyles.searchInput}
              placeholder="Search nearby places…"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {isLoading ? (
            <View
              style={[
                sheetStyles.stateBox,
                { paddingBottom: Math.max(insets.bottom, spacing.lg) },
              ]}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={sheetStyles.stateText}>Finding nearby places…</Text>
            </View>
          ) : isError ? (
            <View
              style={[
                sheetStyles.stateBox,
                { paddingBottom: Math.max(insets.bottom, spacing.lg) },
              ]}
            >
              <Text style={sheetStyles.stateText}>
                Couldn't load nearby places. Try again in a moment.
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View
              style={[
                sheetStyles.stateBox,
                { paddingBottom: Math.max(insets.bottom, spacing.lg) },
              ]}
            >
              <Text style={sheetStyles.stateText}>
                {query.trim() ? "No places match your search." : "No nearby dog-friendly places found."}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={sheetStyles.list}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {filtered.map((candidate) => (
                <GooglePlaceRow
                  key={candidate.googlePlaceId}
                  candidate={candidate}
                  onPress={() => {
                    handleClose();
                    onGooglePlacePress(candidate.googlePlaceId, candidate.name);
                  }}
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
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
  const { user, profile } = useAuthStore();
  const { showGuestPrompt } = useUIStore();
  const queryClient = useQueryClient();
  const [coords, setCoords] = useState<UserCoords>(null);
  const [placesLocationState, setPlacesLocationState] = useState<PlacesLocationState>("unknown");
  const [nearbyDisplayCount, setNearbyDisplayCount] = useState(NEARBY_INITIAL_COUNT);
  const [nuzzleDisplayCount, setNuzzleDisplayCount] = useState(NUZZLE_UNBOOKMARKED_INITIAL_COUNT);
  const [nearbySheetVisible, setNearbySheetVisible] = useState(false);
  const hasRequestedPermissionRef = useRef(false);

  const { data: places = [], isLoading: placesLoading } = useQuery({
    queryKey: ["places"],
    queryFn: listActivePlaces,
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

  const { data: pendingPlaces = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["pendingPlaces"],
    queryFn: listPendingPlacesWithInterests,
    staleTime: 2 * 60_000,
  });

  const [countMeInLoadingId, setCountMeInLoadingId] = useState<string | null>(null);

  const countMeInMutation = useMutation({
    mutationFn: async ({ placeId, isInterested }: { placeId: string; isInterested: boolean }) => {
      if (!user) throw new Error("Sign in to express interest.");
      if (isInterested) {
        await removeCommunityInterest(placeId, user.id);
      } else {
        await markCommunityInterest(placeId, user.id);
      }
    },
    onMutate: async ({ placeId, isInterested }) => {
      setCountMeInLoadingId(placeId);
      if (!user) return { previous: undefined };
      await queryClient.cancelQueries({ queryKey: ["pendingPlaces"] });
      const previous = queryClient.getQueryData<PendingPlaceWithInterests[]>(["pendingPlaces"]);
      const currentUserId = user.id;
      const currentAvatar = profile?.profile_image_url ?? null;
      queryClient.setQueryData<PendingPlaceWithInterests[]>(["pendingPlaces"], (old) => {
        if (!old) return old;
        return old.map((p) => {
          if (p.id !== placeId) return p;
          if (isInterested) {
            return {
              ...p,
              interests: p.interests.filter((i) => i.user_id !== currentUserId),
            };
          }
          if (p.interests.some((i) => i.user_id === currentUserId)) return p;
          return {
            ...p,
            interests: [
              ...p.interests,
              { user_id: currentUserId, profile_image_url: currentAvatar },
            ],
          };
        });
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(["pendingPlaces"], ctx.previous);
      }
    },
    onSettled: () => {
      setCountMeInLoadingId(null);
      queryClient.invalidateQueries({ queryKey: ["pendingPlaces"] });
    },
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
          if (savedPlaceIds.has(place.id)) return true;
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
    [places, coords, savedPlaceIds]
  );

  const filteredPendingPlaces = useMemo(
    () =>
      pendingPlaces.filter((place) => {
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
      }),
    [pendingPlaces, coords]
  );

  const dbGooglePlaceIds = useMemo(
    () =>
      new Set(
        [...places, ...pendingPlaces]
          .map((p) => p.google_place_id)
          .filter(Boolean) as string[]
      ),
    [places, pendingPlaces]
  );

  const dbPlaceNames = useMemo(
    () => new Set([...places, ...pendingPlaces].map((p) => p.name.trim().toLowerCase())),
    [places, pendingPlaces]
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

  const isInitialLoading = placesLoading || pendingLoading;

  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
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
            onSaveToggle={() => {
              if (!user) { showGuestPrompt(); return; }
              toggleSave.mutate({ placeId: place.id, isSaved: savedPlaceIds.has(place.id) });
            }}
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

      {filteredPendingPlaces.length > 0 && (
        <PlacesSection
          title="Pending Communities"
          style={{ marginTop: spacing.md - 2 }}
          isEmpty={false}
          emptyMessage=""
        >
          {filteredPendingPlaces.map((place) => (
            <PendingPlaceRow
              key={place.id}
              place={place}
              photoAccessToken={photoAccessToken}
              userId={user?.id ?? null}
              countMeInLoading={countMeInLoadingId === place.id}
              onPress={() => {
                if (place.google_place_id) {
                  onGooglePlacePress(place.google_place_id, place.name);
                }
              }}
              onCountMeIn={(isInterested) => {
                if (!user) { showGuestPrompt(); return; }
                countMeInMutation.mutate({ placeId: place.id, isInterested });
              }}
            />
          ))}
        </PlacesSection>
      )}

      <View style={{ marginTop: spacing.md }}>
        <Text style={styles.suggestHelperText}>
          Don't see your dog spot? Suggest it and we'll launch it once enough local dog owners are interested.
        </Text>
        <Pressable
          onPress={() => {
            if (!user) { showGuestPrompt(); return; }
            setNearbySheetVisible(true);
          }}
          style={({ pressed }) => [
            styles.suggestButton,
            (placesLocationState === "denied" || placesLocationState === "error") && styles.suggestButtonDisabled,
            pressed && styles.suggestButtonPressed,
          ]}
          disabled={placesLocationState === "denied" || placesLocationState === "error"}
          accessibilityRole="button"
          accessibilityLabel="Suggest Local Community"
        >
          <MapPin
            size={18}
            strokeWidth={2.3}
            color={
              placesLocationState === "denied" || placesLocationState === "error"
                ? colors.textMuted
                : colors.primary
            }
          />
          <Text
            style={[
              styles.suggestButtonText,
              (placesLocationState === "denied" || placesLocationState === "error") &&
                styles.suggestButtonTextDisabled,
            ]}
          >
            Suggest Local Community
          </Text>
        </Pressable>
        {(placesLocationState === "denied" || placesLocationState === "error") && (
          <Text style={styles.placesHintText}>
            {placesLocationState === "denied"
              ? "Enable location in Settings to suggest nearby places."
              : "Couldn't get your location. Check your connection and try again."}
          </Text>
        )}
      </View>
    </ScrollView>

    <NearbySheet
      visible={nearbySheetVisible}
      onClose={() => setNearbySheetVisible(false)}
      candidates={rankedNearbyCandidates}
      isLoading={nearbyPlacesQuery.isFetching}
      isError={nearbyPlacesQuery.isError}
      onGooglePlacePress={(id, name) => {
        setNearbySheetVisible(false);
        onGooglePlacePress(id, name);
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    textAlign: "left",
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
  // ── Pending community card
  pendingCard: {
    backgroundColor: colors.pendingSoft,
    borderWidth: 1.25,
    borderColor: colors.pendingText,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pendingCardPressed: {
    opacity: 0.9,
  },
  pendingCardMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  pendingThumbWrap: {
    width: 80,
    height: 72,
    borderRadius: radius.md,
    flexShrink: 0,
  },
  pendingThumb: {
    width: 80,
    height: 72,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
    position: "relative",
    top: -6,
  },
  pendingThumbFallback: {
    backgroundColor: colors.warningSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingCardContent: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  pendingCardName: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontSize: 16,
  },
  pendingInterestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs + 1,
  },
  pendingInterestText: {
    ...typography.caption,
    color: colors.pendingText,
    fontFamily: "Inter_500Medium",
  },
  pendingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  countMeInButton: {
    borderWidth: 1.25,
    borderColor: colors.pendingText,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.pendingSoft,
  },
  countMeInButtonDone: {
    borderColor: colors.pendingText,
    backgroundColor: colors.pendingSoft,
  },
  countMeInButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  countMeInText: {
    ...typography.caption,
    color: colors.pendingText,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  countMeInTextDone: {
    color: colors.pendingText,
  },
  pendingBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pendingAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pendingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: colors.pendingSoft,
    marginRight: -8,
  },
  pendingAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  pendingAvatarExtra: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.md + 4,
  },
  suggestHelperText: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium',
    textAlign: "left",
    marginBottom: spacing.lg,
    marginTop: -5,
  },
  suggestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1.25,
    borderColor: colors.primary,
    borderRadius: 15,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.md + 5,
  },
  suggestButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  suggestButtonPressed: {
    opacity: 0.8,
  },
  suggestButtonText: {
    ...typography.body,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
    fontSize: 15,
  },
  suggestButtonTextDisabled: {
    color: colors.textMuted,
  },
});

// ── Sheet styles (separate to avoid collision with main styles) ───────────────

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  nearbyPlacesSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    minHeight: "75%",
    maxHeight: "92%",
    ...shadow.md,
  },
  handleArea: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 10,
  },
  handle: {
    alignSelf: "center",
    width: 37,
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(60, 60, 67, 0.75)",
    marginBottom: 11,
    transform: [{ translateY: -2 }],
  },
  sheetHeader: {
    paddingHorizontal: spacing.lg,
    marginTop: -3,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(231, 226, 216, 0.5)",
  },
  sheetTitle: {
    ...typography.subtitle,
    fontFamily: "Inter_700Bold",
    transform: [{ translateY: -12 }],
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: 10,
    marginTop: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  stateBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  stateText: {
    ...typography.bodyMuted,
    textAlign: "center",
    flexShrink: 1,
  },
});
