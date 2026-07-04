export const locales = ['pt-BR', 'en', 'es', 'ja', 'zh', 'ko', 'it'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-BR';
