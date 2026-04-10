import { createI18n } from 'vue-i18n'
import { LS_KEYS } from '@/lib/constants'
import en from './locales/en.json'
import el from './locales/el.json'

export type Locale = 'en' | 'el'

const LS_LOCALE_KEY = 'coffee_inv_locale'

function getSavedLocale(): Locale {
  const saved = localStorage.getItem(LS_LOCALE_KEY)
  if (saved === 'en' || saved === 'el') return saved
  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale(),
  fallbackLocale: 'en',
  messages: { en, el },
})

export function setLocale(locale: Locale) {
  ;(i18n.global.locale as any).value = locale
  localStorage.setItem(LS_LOCALE_KEY, locale)
  document.documentElement.lang = locale
}

export function getLocale(): Locale {
  return (i18n.global.locale as any).value as Locale
}
