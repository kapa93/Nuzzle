import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ImageBackground,
  StyleSheet,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { MapPinCheck, MapPinPlus } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import type { PackItem } from "@/utils/breedAssets";
import type { BreedEnum } from "@/types";

const CARD_GAP = spacing.md;
const H_PADDING = spacing.lg;

type Props = {
  packItems: PackItem[];
  cardWidth: number;
  headerHeight: number;
  homeTabBarHeight: number;
  joinedBreeds: BreedEnum[];
  onBreedPress: (breed: BreedEnum) => void;
  onJoinToggle: (breed: BreedEnum) => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  isGuest?: boolean;
  bannerDismissed?: boolean;
  onBannerDismiss?: () => void;
  onSignUp?: () => void;
};

export function MoreBreedsTab({
  packItems,
  cardWidth,
  headerHeight,
  homeTabBarHeight,
  joinedBreeds,
  onBreedPress,
  onJoinToggle,
  onScroll,
  isGuest = false,
  bannerDismissed = false,
  onBannerDismiss,
  onSignUp,
}: Props) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: headerHeight + homeTabBarHeight + spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {isGuest && !bannerDismissed ? (
        <View style={styles.guestBanner}>
          <Pressable
            onPress={onBannerDismiss}
            style={styles.guestBannerDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss guest banner"
            hitSlop={8}
          >
            <Ionicons name="close" size={21} color={colors.textMuted} />
          </Pressable>
          <View style={styles.guestBannerTitleRow}>
            <Ionicons name="paw" size={17} color={colors.primary} />
            <Text style={styles.guestBannerTitle}>Browsing as a Guest</Text>
          </View>
          <Text style={styles.guestBannerBody}>
            Join breed communities, connect with other dog owners, and participate in the conversation.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.guestBannerCta, pressed && styles.guestBannerCtaPressed]}
            onPress={onSignUp}
            accessibilityRole="button"
            accessibilityLabel="Sign up"
          >
            <Text style={styles.guestBannerCtaText}>Sign Up</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.sectionHint}>View or join one or more breed communities</Text>
      )}
      <View style={styles.gridWrap}>
        <View style={styles.grid}>
          {packItems.map((item) => (
            <Pressable
              key={item.breed}
              style={[styles.cell, { width: cardWidth }]}
              onPress={() => onBreedPress(item.breed)}
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
                    {/* Join / Joined pill – top-right corner */}
                    <Pressable
                      onPress={(e) => { e.stopPropagation?.(); onJoinToggle(item.breed); }}
                      style={({ pressed }) => [
                        styles.joinPill,
                        joinedBreeds.includes(item.breed) && styles.joinPillJoined,
                        pressed && styles.joinPillPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={joinedBreeds.includes(item.breed) ? `Leave ${item.label}` : `Join ${item.label}`}
                    >
                      <Text style={[styles.joinPillText, joinedBreeds.includes(item.breed) && styles.joinPillTextJoined]}>
                        {joinedBreeds.includes(item.breed) ? "Joined" : "Join"}
                      </Text>
                      {joinedBreeds.includes(item.breed)
                        ? <MapPinCheck size={14} color="#ffffff" strokeWidth={2.4} style={styles.joinPillIcon} />
                        : <MapPinPlus size={14} color="#2E3834" strokeWidth={2.4} style={styles.joinPillIcon} />}
                    </Pressable>
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
      <Text style={styles.comingSoonText}>More breeds coming soon!</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: H_PADDING,
    paddingBottom: spacing.xxxl + 75,
  },
  gridWrap: {
    alignItems: "center",
    marginLeft: 10,
    marginTop: spacing.sm,
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
    borderRadius: radius.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: spacing.md,
  },
  cardShadow: {
    borderRadius: radius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
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
  joinPill: {
    position: "absolute",
    top: spacing.sm + 1,
    right: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.81)",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    zIndex: 2,
  },
  joinPillJoined: {
    backgroundColor: "rgba(56, 145, 87, 0.75)",
  },
  joinPillPressed: { opacity: 0.78 },
  joinPillText: { fontSize: 13, fontWeight: "700", color: "#2E3834" },
  joinPillTextJoined: { color: "#ffffff" },
  joinPillIcon: { marginLeft: 3 },
  sectionHint: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    textAlign: "center",
    fontFamily: 'Inter_500Medium',
    marginBottom: spacing.lg - 1,
    marginTop: 2,
  },
  guestBanner: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg - 2,
    gap: spacing.xs + 1,
  },
  guestBannerDismiss: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs + 2,
    padding: spacing.xs,
    zIndex: 1,
  },
  guestBannerTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  guestBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  guestBannerBody: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  guestBannerCta: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm - 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg + 10,
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  guestBannerCtaPressed: {
    opacity: 0.8,
  },
  guestBannerCtaText: {
    ...typography.caption,
    color: colors.surface,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  comingSoonText: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    textAlign: "center",
    fontFamily: 'Inter_500Medium',
    marginTop: spacing.lg - 2,
    letterSpacing: 0.2,
  },
});
