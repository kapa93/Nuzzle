import { useSafeAreaInsets } from "react-native-safe-area-context";

const BAR_HEIGHT = 39; // 5px shorter than default iOS (44)
const OFFSET = 0; // Full header height for content padding

/** Height of the animated stack header (matches AnimatedStackHeader) */
export function useStackHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + insets.top - OFFSET;
}
