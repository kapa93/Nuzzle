import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";
import { colors } from "@/theme";

const WORD_LIMIT = 45;

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  moreStyle?: StyleProp<TextStyle>;
  /** When body is truncated, tapping " ...more" runs this (e.g. navigate to post detail). */
  onMorePress?: () => void;
};

/**
 * Feed preview: truncates to WORD_LIMIT words, then " ...more" (tappable when `onMorePress` is set).
 */
export function ExpandablePostBody({ text, style, moreStyle, onMorePress }: Props) {
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  const needsMore = words.length > WORD_LIMIT;
  const truncated = useMemo(() => words.slice(0, WORD_LIMIT).join(" "), [words]);
  const baseFlat = StyleSheet.flatten(style);
  const moreFlat = StyleSheet.flatten(moreStyle);

  if (!text.trim()) return null;

  if (!needsMore) {
    return <Text style={style}>{text}</Text>;
  }

  const moreLabel = (
    <Text style={[baseFlat, styles.more, moreFlat]}> ...more</Text>
  );

  return (
    <View style={styles.row}>
      <Text style={style}>{truncated}</Text>
      {onMorePress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open full post"
          hitSlop={8}
          onPress={(e) => {
            e.stopPropagation?.();
            onMorePress();
          }}
        >
          {moreLabel}
        </Pressable>
      ) : (
        moreLabel
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    alignSelf: "stretch",
  },
  more: {
    color: colors.primary,
    fontWeight: "600",
  },
});
