import { useI18n } from 'vue-i18n'

interface Nameable {
  name: string
  name_el?: string | null
}

/**
 * Returns a locale-aware name for products or inventory items.
 * When locale is 'el' and name_el is set, returns name_el.
 * Falls back to the English name in all other cases.
 */
export function useProductName() {
  const { locale } = useI18n()

  function getName(item: Nameable): string {
    if (locale.value === 'el' && item.name_el) return item.name_el
    return item.name
  }

  return { getName }
}
