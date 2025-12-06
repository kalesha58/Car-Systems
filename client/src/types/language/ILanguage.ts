export interface ILanguage {
  code: string;
  name: string;
  nativeName: string;
  icon?: string;
}

export type LanguageCode = 'en' | 'hi' | 'te';

export const LANGUAGES: ILanguage[] = [
  {code: 'en', name: 'English', nativeName: 'English'},
  {code: 'hi', name: 'Hindi', nativeName: 'हिंदी'},
  {code: 'te', name: 'Telugu', nativeName: 'తెలుగు'},
];

