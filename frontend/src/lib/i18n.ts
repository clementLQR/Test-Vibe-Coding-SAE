import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from '../locales/en/common.json'
import frCommon from '../locales/fr/common.json'

export const SUPPORTED_LOCALES = ['fr', 'en'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

const STORAGE_KEY = 'evently.locale'

function initialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null && isLocale(stored)) return stored
  } catch {
    // Storage unavailable (private mode): fall back to the browser language
  }
  return navigator.language.startsWith('en') ? 'en' : 'fr'
}

export function changeLocale(locale: Locale): void {
  void i18n.changeLanguage(locale)
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Ignore: the choice simply won't be remembered
  }
}

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

void i18n.use(initReactI18next).init({
  resources: {
    fr: { common: frCommon },
    en: { common: enCommon },
  },
  lng: initialLocale(),
  fallbackLng: 'fr',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
})

export default i18n
