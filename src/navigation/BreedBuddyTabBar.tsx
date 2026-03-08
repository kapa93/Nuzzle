import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { DogPawIcon } from "@/assets/DogPawIcon";
import { colors, spacing, typography } from "@/theme";

const TAB_CONFIG = [
  { key: "Home", label: "Home", icon: "home" as const },
  { key: "Explore", label: "Explore", icon: "compass" as const },
  { key: "Create", label: "Create", icon: "create-outline" as const },
  { key: "Notifications", label: "Alerts", icon: "notifications" as const },
  { key: "Profile", label: "Profile", icon: "person" as const },
];

export function BreedBuddyTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      {TAB_CONFIG.map((item, idx) => {
        const isCenter = idx === 2;
        const isActive = state.routeNames[state.index] === item.key;

        if (isCenter) {
          return (
            <Pressable
              key={item.key}
              onPress={() => navigation.navigate("Create")}
              style={styles.centerWrap}
            >
              <View style={styles.centerButton}>
                <DogPawIcon size={28} color="#FFFFFF" />
              </View>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={item.key}
            onPress={() => navigation.navigate(item.key)}
            style={styles.item}
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.label,
                isActive ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  item: {
    alignItems: "center",
    flex: 1,
  },
  label: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  labelInactive: {
    color: colors.textMuted,
  },
  centerWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: colors.background,
  },
  centerIcon: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  centerText: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textPrimary,
    fontWeight: "700",
  },
});
