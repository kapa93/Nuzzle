import { ConfigContext, ExpoConfig } from 'expo/config';

const IS_PROD = process.env.APP_VARIANT === 'production';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PROD ? 'Nuzzle' : 'Nuzzle Dev',
  icon: './assets/dog-linear-black.png',
  ios: {
    ...config.ios,
    bundleIdentifier: IS_PROD ? 'com.kapa.nuzzle' : 'com.kapa.nuzzle-dev',
  },
  android: {
    ...config.android,
    package: IS_PROD ? 'com.kapa.nuzzle' : 'com.kapa.nuzzledev',
  },
});
