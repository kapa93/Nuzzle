import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-url-polyfill/auto', () => ({}));
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
