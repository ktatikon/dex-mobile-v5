import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translation files (complete)
import enCommon from '@/locales/en/common.json';
import enNavigation from '@/locales/en/navigation.json';
import enAuth from '@/locales/en/auth.json';
import enWallet from '@/locales/en/wallet.json';
import enTrading from '@/locales/en/trading.json';
import enChat from '@/locales/en/chat.json';

// Import Spanish translation files (partial)
import esCommon from '@/locales/es/common.json';
import esNavigation from '@/locales/es/navigation.json';
import esAuth from '@/locales/es/auth.json';
import esWallet from '@/locales/es/wallet.json';
import esTrading from '@/locales/es/trading.json';
import esChat from '@/locales/es/chat.json';

// Import French translation files (complete)
import frCommon from '@/locales/fr/common.json';
import frNavigation from '@/locales/fr/navigation.json';
import frAuth from '@/locales/fr/auth.json';
import frWallet from '@/locales/fr/wallet.json';
import frTrading from '@/locales/fr/trading.json';
import frChat from '@/locales/fr/chat.json';

// Import German translation files (complete)
import deCommon from '@/locales/de/common.json';
import deNavigation from '@/locales/de/navigation.json';
import deAuth from '@/locales/de/auth.json';
import deWallet from '@/locales/de/wallet.json';
import deTrading from '@/locales/de/trading.json';
import deChat from '@/locales/de/chat.json';

// Import Telugu translation files
import teCommon from '@/locales/te/common.json';
import teNavigation from '@/locales/te/navigation.json';
import teAuth from '@/locales/te/auth.json';
import teWallet from '@/locales/te/wallet.json';
import teTrading from '@/locales/te/trading.json';
import teChat from '@/locales/te/chat.json';

// Import Hindi translation files
import hiCommon from '@/locales/hi/common.json';
import hiNavigation from '@/locales/hi/navigation.json';
import hiAuth from '@/locales/hi/auth.json';
import hiWallet from '@/locales/hi/wallet.json';
import hiTrading from '@/locales/hi/trading.json';
import hiChat from '@/locales/hi/chat.json';

// Import Kannada translation files
import knCommon from '@/locales/kn/common.json';
import knNavigation from '@/locales/kn/navigation.json';
import knAuth from '@/locales/kn/auth.json';
import knWallet from '@/locales/kn/wallet.json';
import knTrading from '@/locales/kn/trading.json';
import knChat from '@/locales/kn/chat.json';

// Create fallback translations for missing languages
const createFallbackTranslations = () => ({
  common: {},
  navigation: {},
  auth: {},
  wallet: {},
  trading: {},
  chat: {}
});

// Language configuration
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' }
];

// Resources object
const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    wallet: enWallet,
    trading: enTrading,
    chat: enChat
  },
  es: {
    common: esCommon,
    navigation: esNavigation,
    auth: esAuth,
    wallet: esWallet,
    trading: esTrading,
    chat: esChat
  },
  fr: {
    common: frCommon,
    navigation: frNavigation,
    auth: frAuth,
    wallet: frWallet,
    trading: frTrading,
    chat: frChat
  },
  de: {
    common: deCommon,
    navigation: deNavigation,
    auth: deAuth,
    wallet: deWallet,
    trading: deTrading,
    chat: deChat
  },
  te: {
    common: teCommon,
    navigation: teNavigation,
    auth: teAuth,
    wallet: teWallet,
    trading: teTrading,
    chat: teChat
  },
  hi: {
    common: hiCommon,
    navigation: hiNavigation,
    auth: hiAuth,
    wallet: hiWallet,
    trading: hiTrading,
    chat: hiChat
  },
  kn: {
    common: knCommon,
    navigation: knNavigation,
    auth: knAuth,
    wallet: knWallet,
    trading: knTrading,
    chat: knChat
  }
};

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'navigation', 'auth', 'wallet', 'trading', 'chat'],

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'dex-mobile-language'
    },

    interpolation: {
      escapeValue: false // React already does escaping
    },

    react: {
      useSuspense: false
    }
  });

export default i18n;
