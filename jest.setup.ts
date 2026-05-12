import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-url-polyfill/auto', () => ({}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
  dismissBrowser: jest.fn(),
  maybeCompleteAuthSession: jest.fn().mockReturnValue({ type: 'success' }),
  WebBrowserResultType: { CANCEL: 'cancel', DISMISS: 'dismiss', OPENED: 'opened', SUCCESS: 'success' },
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'nuzzle://auth/callback'),
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  useAutoDiscovery: jest.fn(() => null),
}));

jest.mock('@/components/NotificationsSheet', () => ({
  NotificationsSheet: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    useSafeAreaInsets: () => insets,
    SafeAreaInsetsContext: { Consumer: ({ children }: { children: (v: typeof insets) => React.ReactNode }) => children(insets) },
  };
});
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('react-native-reanimated', () => {
  const ReactNative = require('react-native');
  const Animated = {
    View: ReactNative.View,
    Text: ReactNative.Text,
    ScrollView: ReactNative.ScrollView,
    Image: ReactNative.Image,
    FlatList: ReactNative.FlatList,
    createAnimatedComponent: (Component: unknown) => Component,
  };

  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (initialValue: unknown) => ({ value: initialValue }),
    useAnimatedStyle: (updater: () => object) => updater(),
    withTiming: (toValue: unknown) => toValue,
    interpolateColor: (
      _value: number,
      _inputRange: number[],
      outputRange: [string, string] | string[]
    ) => outputRange[0],
  };
});
