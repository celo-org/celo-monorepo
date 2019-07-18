import { format } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { i18n as i18nType, TranslationFunction } from 'i18next'

export const maskPhoneNumber = (phoneNumber?: string) => {
  return `+XXX XXX XXX ${phoneNumber ? phoneNumber.substr(-4) : 'XXXX'}`
}

// TODO(Rossy): move date formatting stuff to a shared location
// We should break the tight dependency on the i18n lib first though
export const formatFeedTime = (timestamp: number, i18next: i18nType) => {
  return format(timestamp * 1000, 'h:mm a', {
    locale: i18next.language.includes('es') ? es : enUS,
  })
}

export const formatFeedDate = (timestamp: number, i18next: i18nType) => {
  return format(timestamp * 1000, 'MMM d', {
    locale: i18next.language.includes('es') ? es : enUS,
  })
}

export const getDatetimeDisplayString = (
  timestamp: number,
  t: TranslationFunction,
  i18next: i18nType
) => {
  const timeFormatted = formatFeedTime(timestamp, i18next)
  const dateFormatted = formatFeedDate(timestamp, i18next)
  return `${dateFormatted} ${t('common:at')} ${timeFormatted}`
}
