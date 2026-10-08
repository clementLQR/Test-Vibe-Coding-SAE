import { useTranslation } from 'react-i18next'
import { changeLocale, SUPPORTED_LOCALES, type Locale } from '../lib/i18n'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t('language.label')}</span>
      <select
        className="rounded border border-current bg-transparent px-2 py-1"
        value={i18n.resolvedLanguage}
        onChange={(event) => changeLocale(event.target.value as Locale)}
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <option key={locale} value={locale} className="text-black">
            {t(`language.${locale}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
