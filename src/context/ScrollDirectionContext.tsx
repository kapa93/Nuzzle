import React, { createContext, useContext, useState, useCallback } from "react";

export type ScrollDirection = "up" | "down";

type ScrollDirectionContextValue = {
  scrollDirection: ScrollDirection;
  setScrollDirection: (dir: ScrollDirection) => void;
};

const ScrollDirectionContext = createContext<ScrollDirectionContextValue | null>(null);

export function ScrollDirectionProvider({ children }: { children: React.ReactNode }) {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>("up");
  return (
    <ScrollDirectionContext.Provider value={{ scrollDirection, setScrollDirection }}>
      {children}
    </ScrollDirectionContext.Provider>
  );
}

export function useScrollDirection() {
  const ctx = useContext(ScrollDirectionContext);
  if (!ctx) return { scrollDirection: "up" as ScrollDirection, setScrollDirection: () => {} };
  return ctx;
}

const SCROLL_THRESHOLD = 3;
const AT_TOP_THRESHOLD = 10; // Near top - ignore "down" to prevent bounce from hiding nav/header
const AT_BOTTOM_THRESHOLD = 10; // Near bottom - ignore "up" to prevent bounce from showing nav/header

type ScrollEvent = {
  nativeEvent: {
    contentOffset: { y: number };
    contentSize?: { height: number };
    layoutMeasurement?: { height: number };
  };
};

export function useScrollDirectionUpdater() {
  const { setScrollDirection } = useScrollDirection();
  const lastOffset = React.useRef(0);

  const onScroll = useCallback(
    (e: ScrollEvent) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const y = contentOffset.y;
      const diff = y - lastOffset.current;
      lastOffset.current = y;
      if (Math.abs(diff) < SCROLL_THRESHOLD) return;
      // At top: bounce overscroll can trigger "down" - keep nav/header visible
      if (y < AT_TOP_THRESHOLD && diff > 0) return;
      // At bottom: bounce overscroll can trigger "up" - keep nav/header hidden
      const atBottom =
        contentSize &&
        layoutMeasurement &&
        y + layoutMeasurement.height >= contentSize.height - AT_BOTTOM_THRESHOLD;
      if (atBottom && diff < 0) return;
      setScrollDirection(diff > 0 ? "down" : "up");
    },
    [setScrollDirection]
  );

  return { onScroll };
}
