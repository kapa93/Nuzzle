import React, { useEffect, useRef } from "react";
import { Animated, Easing, Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { colors, radius, spacing, typography } from "@/theme";

export function GuestSignupPrompt() {
  const visible = useUIStore((s) => s.guestPromptVisible);
  const hideGuestPrompt = useUIStore((s) => s.hideGuestPrompt);
  const setIsGuest = useAuthStore((s) => s.setIsGuest);
  const setPendingSignUp = useAuthStore((s) => s.setPendingSignUp);

  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      animVal.setValue(0);
      Animated.timing(animVal, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSignUp = () => {
    hideGuestPrompt();
    setPendingSignUp(true);
    setIsGuest(false);
  };

  const handleLogIn = () => {
    hideGuestPrompt();
    setIsGuest(false);
  };

  const handleDismiss = () => {
    hideGuestPrompt();
  };

  const sheetStyle = {
    opacity: animVal,
    transform: [
      {
        scale: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0.88, 1],
        }),
      },
    ],
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: animVal }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <Text style={styles.title}>Join the Nuzzle Community</Text>
          <Text style={styles.body}>
            Create an account to join local dog communities, discover dog-friendly spots, find meetups, and share insights with fellow dog owners.
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.signUpBtn, pressed && styles.signUpBtnPressed]}
              onPress={handleSignUp}
            >
              <Text style={styles.signUpText}>Sign Up</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.logInBtn, pressed && styles.logInBtnPressed]}
              onPress={handleLogIn}
            >
              <Text style={styles.logInText}>Log In</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.dismissBtn, pressed && styles.dismissBtnPressed]}
            onPress={handleDismiss}
          >
            <Text style={styles.dismissText}>Not Now</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
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
  title: {
    ...typography.titleMD,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  body: {
    ...typography.bodyMuted,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  signUpBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  signUpBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  signUpText: {
    ...typography.body,
    color: colors.surface,
  },
  logInBtn: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  logInBtnPressed: {
    backgroundColor: colors.border,
  },
  logInText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
