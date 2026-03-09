import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadow, spacing, typography } from "../theme";

type Item = { key: string; label: string; icon: string };

export function BottomNav({ items, activeKey, centerActionLabel = "+" }: { items: Item[]; activeKey: string; centerActionLabel?: string }) {
  return (
    <View style={styles.wrap}>
      {items.map((item, idx) => {
        const center = idx === 2;
        if (center) {
          return (
            <View key={item.key} style={styles.centerWrap}>
              <View style={styles.centerButton}><Text style={styles.centerIcon}>{centerActionLabel}</Text></View>
              <Text style={styles.centerText}>{item.label}</Text>
            </View>
          );
        }
        const active = item.key === activeKey;
        return (
          <Pressable key={item.key} style={styles.item}>
            <Text style={[styles.icon, active && styles.iconActive]}>{item.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  item: { alignItems: "center", flex: 1 },
  centerWrap: { alignItems: "center", flex: 1, marginTop: -spacing.xl },
  centerButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", ...shadow.sm },
  centerIcon: { color: "#FFFFFF", fontSize: 22, fontWeight: "800" },
  centerText: { ...typography.caption, marginTop: spacing.xs, color: colors.textPrimary, fontWeight: "700" },
  icon: { fontSize: 22, color: colors.textMuted },
  iconActive: { color: colors.primary },
  label: { ...typography.caption, marginTop: spacing.xs },
  labelActive: { color: colors.primary, fontWeight: "700" },
});
