import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {useLanguageStore} from '@state/languageStore';
import en from '../locales/en/translations.json';
import hi from '../locales/hi/translations.json';
import te from '../locales/te/translations.json';

const resources = {
  en: {translation: en},
  hi: {translation: hi},
  te: {translation: te},
};

// Get initial language from store, default to 'en' if not available
const getInitialLanguage = (): string => {
  try {
    const store = useLanguageStore.getState();
    return store.selectedLanguage || 'en';
  } catch {
    return 'en';
  }
};

const currentLanguage = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: currentLanguage,
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  .then(() => {
    i18nInitialized = true;
  });

// Export a function to update i18n language
// This will be called directly from languageStore to avoid circular dependencies
export const updateI18nLanguage = (language: string): void => {
  if (language && i18n.language !== language) {
    i18n.changeLanguage(language).catch(() => {
      // Silently handle any errors
    });
  }
};

// Store reference for synchronous access
let i18nInitialized = false;
export const setI18nInitialized = (): void => {
  i18nInitialized = true;
};

// Listen to language changes from store and update i18n
// This subscription ensures i18n language changes when store updates
// React components using useTranslation() will automatically re-render
let previousLanguage = currentLanguage;
useLanguageStore.subscribe((state) => {
  const currentLang = state.selectedLanguage;
  if (currentLang && currentLang !== previousLanguage) {
    previousLanguage = currentLang;
    updateI18nLanguage(currentLang);
  }
});

export default i18n;

