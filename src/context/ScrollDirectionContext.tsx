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

const SCROLL_THRESHOLD = 5;

export function useScrollDirectionUpdater() {
  const { setScrollDirection } = useScrollDirection();
  const lastOffset = React.useRef(0);

  const onScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = e.nativeEvent.contentOffset.y;
      const diff = y - lastOffset.current;
      lastOffset.current = y;
      if (Math.abs(diff) < SCROLL_THRESHOLD) return;
      setScrollDirection(diff > 0 ? "down" : "up");
    },
    [setScrollDirection]
  );

  return { onScroll };
}
