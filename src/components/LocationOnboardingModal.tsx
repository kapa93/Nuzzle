import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "@/store/uiStore";
import { useLocationStore } from "@/store/locationStore";
import type { LocationCandidate } from "@/api/places";
import { LocationSearchModal } from "./LocationSearchModal";
import { colors, radius, spacing, typography } from "@/theme";

export function LocationOnboardingModal() {
  const visible = useUIStore((s) => s.locationModalVisible);
  const hideLocationModal = useUIStore((s) => s.hideLocationModal);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);

  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && !searchVisible) {
      animVal.setValue(0);
      Animated.timing(animVal, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, searchVisible]);

  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    setGpsError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setGpsError(
          "Location permission was denied. You can search for a location instead, or enable it in Settings."
        );
        setGpsLoading(false);
        return;
      }

      // Permission granted — bump the version so screens re-run their location check.
      useLocationStore.getState().bumpLocationSetupVersion();
      useLocationStore.getState().setHasSeenLocationModal(true);
      hideLocationModal();
    } catch {
      setGpsError("Couldn't request location permission. Please try again.");
    }

    setGpsLoading(false);
  };

  const handleSearchLocation = () => {
    setSearchVisible(true);
  };

  const handleLocationSelected = (candidate: LocationCandidate) => {
    useLocationStore.getState().setManualLocation({
      name: candidate.name,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
    });
    useLocationStore.getState().bumpLocationSetupVersion();
    useLocationStore.getState().setHasSeenLocationModal(true);
    setSearchVisible(false);
    hideLocationModal();
  };

  const handleNotNow = () => {
    useLocationStore.getState().setHasSeenLocationModal(true);
    hideLocationModal();
  };

  const handleClose = () => {
    handleNotNow();
  };

  return (
    <>
      <Modal
        visible={visible && !searchVisible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <Animated.View style={[styles.overlay, { opacity: animVal }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <Animated.View
            style={[
              styles.sheet,
              {
                opacity: animVal,
                transform: [
                  {
                    scale: animVal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.88, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={32} color={colors.primary} />
            </View>

            <Text style={styles.title}>Discover Local Dog Communities</Text>
            <Text style={styles.body}>
              Nuzzle uses your location to show nearby dog communities, dog-friendly spots, and local meetups.
            </Text>

            {!!gpsError && (
              <Text style={styles.errorText}>{gpsError}</Text>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
                gpsLoading && styles.primaryBtnDisabled,
              ]}
              onPress={handleUseCurrentLocation}
              disabled={gpsLoading}
              accessibilityRole="button"
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.primaryBtnText}>Use Current Location</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.secondaryBtnPressed,
              ]}
              onPress={handleSearchLocation}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>Search for a Location</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.dismissBtn,
                pressed && styles.dismissBtnPressed,
              ]}
              onPress={handleNotNow}
              accessibilityRole="button"
            >
              <Text style={styles.dismissText}>Not Now</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>

      <LocationSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSelect={handleLocationSelected}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    alignSelf: "center",
    marginBottom: spacing.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.titleMD,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  body: {
    ...typography.bodyMuted,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    minHeight: 46,
  },
  primaryBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    ...typography.body,
    color: colors.surface,
  },
  secondaryBtn: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnPressed: {
    backgroundColor: colors.border,
  },
  secondaryBtnText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  dismissBtn: {
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  dismissBtnPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  dismissText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
