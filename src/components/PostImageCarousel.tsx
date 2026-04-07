import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  images: string[];
  imageHeight?: number;
};

function getPageIndex(offsetX: number, pageWidth: number) {
  if (!pageWidth) return 0;
  return Math.max(0, Math.round(offsetX / pageWidth));
}

export function PostImageCarousel({ images, imageHeight = 240 }: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const viewerListRef = useRef<FlatList<string>>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const inlineWidth = containerWidth || Math.max(windowWidth - spacing.xl * 2, 1);
  const viewerTopInset = Math.max(
    insets.top,
    Platform.OS === "ios" ? 44 : StatusBar.currentHeight ?? 0
  );
  const inlinePages = useMemo(() => {
    const pages: string[][] = [];
    for (let index = 0; index < images.length; index += 2) {
      pages.push(images.slice(index, index + 2));
    }
    return pages;
  }, [images]);

  const handleInlineScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setActiveIndex(getPageIndex(event.nativeEvent.contentOffset.x, inlineWidth));
    },
    [inlineWidth]
  );

  const handleViewerScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setViewerIndex(getPageIndex(event.nativeEvent.contentOffset.x, windowWidth));
    },
    [windowWidth]
  );

  const openViewer = useCallback((index: number) => {
    setActiveIndex(Math.floor(index / 2));
    setViewerIndex(index);
    setViewerVisible(true);
  }, []);

  useEffect(() => {
    if (!viewerVisible) return;
    const timer = setTimeout(() => {
      viewerListRef.current?.scrollToIndex({ index: viewerIndex, animated: false });
    }, 0);
    return () => clearTimeout(timer);
  }, [viewerVisible, viewerIndex]);

  const dots = useMemo(
    () =>
      inlinePages.map((_, index) => (
        <View
          key={`dot-${index}`}
          style={[styles.dot, index === activeIndex ? styles.dotActive : styles.dotInactive]}
        />
      )),
    [activeIndex, inlinePages]
  );

  if (!images.length) return null;

  return (
    <>
      <View
        style={styles.inlineRoot}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      >
        {images.length === 1 ? (
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              openViewer(0);
            }}
            style={[styles.singleImageWrap, { height: imageHeight }]}
          >
            <Image source={{ uri: images[0] }} style={styles.inlineImage} resizeMode="cover" />
          </Pressable>
        ) : (
          <FlatList
            data={inlinePages}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => `page-${index}`}
            onMomentumScrollEnd={handleInlineScrollEnd}
            getItemLayout={(_, index) => ({
              length: inlineWidth,
              offset: inlineWidth * index,
              index,
            })}
            renderItem={({ item, index }) => (
              <View style={[styles.inlineSlide, { width: inlineWidth, height: imageHeight }]}>
                <View style={styles.inlinePairRow}>
                  {item.map((uri, pairIndex) => (
                    <Pressable
                      key={`${uri}-${pairIndex}`}
                      onPress={(event) => {
                        event.stopPropagation();
                        openViewer(index * 2 + pairIndex);
                      }}
                      style={styles.inlinePairImageWrap}
                    >
                      <Image source={{ uri }} style={styles.inlineImage} resizeMode="cover" />
                    </Pressable>
                  ))}
                  {item.length === 1 ? <View style={styles.inlinePairImageWrap} /> : null}
                </View>
              </View>
            )}
          />
        )}

        {images.length > 1 ? (
          <>
            <View style={styles.dotsRow}>{dots}</View>
          </>
        ) : null}
      </View>

      <Modal
        visible={viewerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <SafeAreaView edges={["left", "right", "bottom"]} style={styles.viewerRoot}>
          <View style={[styles.viewerHeader, { paddingTop: viewerTopInset + spacing.sm }]}>
            <View style={styles.viewerCountBadge}>
              <Text style={styles.viewerCountText}>
                {viewerIndex + 1} / {images.length}
              </Text>
            </View>
            <Pressable
              onPress={() => setViewerVisible(false)}
              hitSlop={10}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </Pressable>
          </View>

          <FlatList
            ref={viewerListRef}
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={viewerIndex}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleViewerScrollEnd}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            getItemLayout={(_, index) => ({
              length: windowWidth,
              offset: windowWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={[styles.viewerSlide, { width: windowWidth, height: windowHeight * 0.82 }]}>
                <Image source={{ uri: item }} style={styles.viewerImage} resizeMode="contain" />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  inlineRoot: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
  },
  singleImageWrap: {
    width: "100%",
  },
  inlineSlide: {
    backgroundColor: colors.surfaceMuted,
  },
  inlinePairRow: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
  },
  inlinePairImageWrap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
  },
  inlineImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.surfaceMuted,
  },
  dotsRow: {
    position: "absolute",
    bottom: spacing.sm,
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "rgba(15, 23, 42, 0.68)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  dotActive: {
    backgroundColor: "#FFF",
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  viewerRoot: {
    flex: 1,
    backgroundColor: "#000",
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  viewerCountBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  viewerCountText: {
    ...typography.body,
    color: "#FFF",
    fontWeight: "700",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  viewerSlide: {
    alignItems: "center",
    justifyContent: "center",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
  },
});
