import React, { useState, useRef } from "react";
import { Pressable, StyleSheet, Text, View, Modal, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing, typography } from "../theme";
import { Avatar } from "./Avatar";
import { ImageStrip } from "./ImageStrip";
import { ReactionBar } from "@/components/ReactionBar";
import { TagChip } from "./TagChip";
import type { QuestionCardData } from "./types";
import type { ReactionEnum } from "@/types";

type Props = {
  data: QuestionCardData;
  onPress?: () => void;
  onReactionSelect?: (reaction: ReactionEnum | null) => void;
  onReactionMenuOpenChange?: (open: boolean) => void;
  currentUserId?: string | null;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
};

function getBarksText(count: number) {
  return count === 1 ? "1 Bark" : `${count} Barks`;
}

const QuestionCardInner = ({ data, onPress, onReactionSelect, onReactionMenuOpenChange, currentUserId, onEdit, onDelete }: Props) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuLayout, setMenuLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const menuBtnRef = useRef<View>(null);
  const isOwnPost = currentUserId && data.authorId === currentUserId;
  const showMenu = isOwnPost && (onEdit || onDelete);

  const openMenu = () => {
    menuBtnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuLayout({ x, y, width, height: height ?? 28 });
      setMenuVisible(true);
    });
  };

  const handleEdit = () => {
    setMenuVisible(false);
    onEdit?.(data.id);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    onDelete?.(data.id);
  };

  const content = (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar
          size={42}
          source={data.authorAvatarUri ? { uri: data.authorAvatarUri } : undefined}
          fallback={data.author?.[0]?.toUpperCase() ?? "🐶"}
        />
        <View style={styles.headerText}>
          <Text style={styles.author}>{data.author}</Text>
          <Text style={styles.meta}>{data.authorMeta ?? "Question • 1h ago"}</Text>
        </View>
        {showMenu && (
          <Pressable
            ref={menuBtnRef}
            hitSlop={12}
            onPress={openMenu}
            onStartShouldSetResponder={() => true}
            style={styles.menuBtn}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {showMenu && (
        <Modal visible={menuVisible} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
            <View
              style={[
                styles.menuDropdown,
                {
                  top: menuLayout.y + menuLayout.height + 4,
                  right: Dimensions.get("window").width - (menuLayout.x + menuLayout.width),
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              {onEdit && (
                <TouchableOpacity style={styles.menuItem} onPress={handleEdit} activeOpacity={0.7}>
                  <Ionicons name="pencil-outline" size={20} color={colors.textPrimary} />
                  <Text style={styles.menuItemText}>Edit</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleDelete} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Modal>
      )}

      {!!data.badge && (
        <View style={styles.badges}>
          <TagChip label={data.badge} tone={data.badgeTone ?? "neutral"} />
        </View>
      )}

      <Text style={styles.title}>{data.title}</Text>
      {!!data.preview && <Text style={styles.preview}>{data.preview}</Text>}
      {!!data.images?.length && <ImageStrip images={data.images} />}
      <View style={styles.actionRow}>
        {onReactionSelect ? (
          <ReactionBar
            reactions={data.reaction_counts ?? {}}
            userReaction={data.user_reaction}
            onSelect={onReactionSelect}
            onMenuOpenChange={onReactionMenuOpenChange}
          />
        ) : (
          <View style={styles.reactionPlaceholder}>
            <Text style={styles.reactionPlaceholderText}>
              👍{" "}
              {data.reaction_counts
                ? Object.values(data.reaction_counts).reduce((s, c) => s + (c ?? 0), 0)
                : (data.likeCount ?? 0) + (data.loveCount ?? 0) + (data.hahaCount ?? 0)}{" "}
              reactions
            </Text>
          </View>
        )}
        <View style={styles.answersPill}>
          <Text style={styles.answersText}>💬 {getBarksText(data.answerCount ?? 0)}</Text>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }
  return content;
};

export const QuestionCard = React.memo(QuestionCardInner);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, ...shadow.sm },
  header: { flexDirection: "row", alignItems: "center" },
  headerText: { flex: 1, marginLeft: spacing.md },
  author: { ...typography.subtitle, fontSize: 18 },
  meta: { ...typography.caption },
  menuBtn: { padding: spacing.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  menuDropdown: {
    position: "absolute",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  menuItemDanger: {},
  menuItemText: { ...typography.body, fontWeight: "600" },
  menuItemTextDanger: { color: "#DC2626" },
  badges: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, flexWrap: "wrap", gap: spacing.sm },
  title: { ...typography.titleMD, marginTop: spacing.md },
  preview: { ...typography.bodyMuted, marginTop: spacing.sm },
  actionRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: spacing.sm, flexWrap: "wrap" },
  answersPill: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  answersText: { ...typography.bodyMuted, fontWeight: "700" },
  pressed: { opacity: 0.95 },
  reactionPlaceholder: { marginTop: spacing.sm },
  reactionPlaceholderText: { ...typography.bodyMuted, fontSize: 14 },
});
