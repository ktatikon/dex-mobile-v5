
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dexmobile.app',
  appName: 'V-DEX Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [
      'https://api.coingecko.com',
      'https://api.coinmarketcap.com',
      'https://mainnet.infura.io',
      'https://polygon-rpc.com',
      'https://bsc-dataseed.binance.org'
    ]
  },
  android: {
    buildOptions: {
      keystorePath: null,
      keystoreAlias: null,
      releaseType: 'APK'
    },
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      spinnerColor: '#FF3B30'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark'
    }
  }
};

export default config;
