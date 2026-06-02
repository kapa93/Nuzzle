import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

const REASONS = [
  "Spam",
  "Harassment",
  "Inappropriate Content",
  "Misinformation",
  "Other",
] as const;

export type ReportReason = (typeof REASONS)[number];

const CONFIRM_DELAY_MS = 250;

interface Props {
  visible: boolean;
  onSelect: (reason: ReportReason) => void;
  onClose: () => void;
}

export function ReportReasonModal({ visible, onSelect, onClose }: Props) {
  const [selected, setSelected] = useState<ReportReason | null>(null);

  const handlePress = useCallback(
    (reason: ReportReason) => {
      setSelected(reason);
      setTimeout(() => {
        setSelected(null);
        onSelect(reason);
      }, CONFIRM_DELAY_MS);
    },
    [onSelect]
  );

  const handleClose = useCallback(() => {
    setSelected(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Report Post</Text>
          <Text style={styles.subtitle}>Select a reason:</Text>
          {REASONS.map((reason) => (
            <Pressable
              key={reason}
              style={[
                styles.row,
                selected === reason && styles.rowPressed,
              ]}
              onPress={() => handlePress(reason)}
              disabled={selected !== null}
            >
              <View style={[styles.radio, selected === reason && styles.radioSelected]} />
              <Text style={styles.rowText}>{reason}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    ...typography.titleMD,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  rowText: {
    ...typography.body,
  },
});
