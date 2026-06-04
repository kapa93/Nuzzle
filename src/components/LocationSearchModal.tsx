import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { searchLocationCandidates, type LocationCandidate } from "@/api/places";
import { colors, radius, spacing, typography } from "@/theme";

interface LocationSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (candidate: LocationCandidate) => void;
}

export function LocationSearchModal({
  visible,
  onClose,
  onSelect,
}: LocationSearchModalProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [visible]);

  const searchQuery = useQuery({
    queryKey: ["locationSearch", debouncedQuery],
    queryFn: () => searchLocationCandidates(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
    retry: false,
  });

  const isLoading = searchQuery.isFetching;
  const results = searchQuery.data ?? [];
  const showEmpty =
    !isLoading && debouncedQuery.length >= 2 && results.length === 0;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Set Your Location</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search input */}
        <View style={styles.searchRow}>
          <Ionicons
            name="search"
            size={18}
            color={colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="City, neighborhood, landmark…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="words"
          />
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.searchSpinner}
            />
          )}
        </View>

        {/* Results */}
        {debouncedQuery.length < 2 ? (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              Type a city, neighborhood, or landmark to find your location.
            </Text>
          </View>
        ) : showEmpty ? (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>No results found. Try a different search.</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, index) =>
              `${item.name}-${item.latitude}-${item.longitude}-${index}`
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + spacing.xl },
            ]}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.resultRow,
                  pressed && styles.resultRowPressed,
                ]}
                onPress={() => onSelect(item)}
                accessibilityRole="button"
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.resultIcon}
                />
                <View style={styles.resultText}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {!!item.formattedAddress && (
                    <Text style={styles.resultAddress} numberOfLines={1}>
                      {item.formattedAddress}
                    </Text>
                  )}
                </View>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  headerTitle: {
    flex: 1,
    ...typography.subtitle,
    textAlign: "center",
  },
  headerSpacer: {
    width: 36,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 44,
    ...typography.body,
    color: colors.textPrimary,
  },
  searchSpinner: {
    marginLeft: spacing.xs,
  },
  hintContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    alignItems: "center",
  },
  hintText: {
    ...typography.bodyMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  listContent: {
    paddingTop: spacing.xs,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  resultRowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  resultIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  resultAddress: {
    ...typography.caption,
    color: colors.textMuted,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 20 + spacing.sm,
  },
});
