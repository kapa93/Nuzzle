import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colors, radius, shadow, spacing, typography } from "../theme";

export function SegmentTabs({ tabs, activeTab, onChange }: { tabs: string[]; activeTab: string; onChange: (tab: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {tabs.map((tab, i) => {
        const active = tab === activeTab;
        const isLast = i === tabs.length - 1;
        return (
          <Pressable key={tab} onPress={() => onChange(tab)} style={[styles.tab, active && styles.tabActive, !isLast && styles.tabGap]}>
            <Text style={[styles.label, active && styles.labelActive]}>{tab}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingBottom: spacing.sm },
  tab: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadow.sm,
  },
  tabGap: { marginRight: spacing.xxs },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  label: { ...typography.bodyMuted, fontWeight: "700" },
  labelActive: { color: "#FFFFFF" },
});
