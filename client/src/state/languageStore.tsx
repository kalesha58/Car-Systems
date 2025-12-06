import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';
import {LanguageCode} from '../types/language/ILanguage';

interface ILanguageStore {
  selectedLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
}

// Lazy load i18n update function to avoid circular dependency
let updateI18nFn: ((lang: string) => void) | null = null;

const updateI18nLanguage = (language: string): void => {
  if (!updateI18nFn) {
    // Try to get it synchronously if i18n is already loaded
    try {
      const i18nModule = require('../config/i18n');
      updateI18nFn = i18nModule.updateI18nLanguage;
    } catch {
      // If not available, use async import
      import('../config/i18n').then((module) => {
        updateI18nFn = module.updateI18nLanguage;
        if (updateI18nFn) {
          updateI18nFn(language);
        }
      });
      return;
    }
  }
  if (updateI18nFn) {
    updateI18nFn(language);
  }
};

export const useLanguageStore = create<ILanguageStore>()(
  persist(
    (set) => ({
      selectedLanguage: 'en',
      setLanguage: (language: LanguageCode) => {
        set({selectedLanguage: language});
        // Update i18n immediately to trigger React re-renders
        updateI18nLanguage(language);
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

