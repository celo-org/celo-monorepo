import i18n, { LanguageDetectorModule } from 'i18next'
import locales, { Namespaces } from 'locales'
import { initReactI18next } from 'react-i18next'
import RNLanguages from 'react-native-languages'
import logger from 'src/utils/logger'

const TAG = 'i18n'

const languageDetector: LanguageDetectorModule = {
  type: 'languageDetector',
  detect: () => {
    return RNLanguages.language
  },
  init: () => {
    logger.debug(TAG, 'Initing language detector')
  },
  cacheUserLanguage: (lng: string) => {
    logger.debug(TAG, `Skipping user language cache ${lng}`)
  },
}

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: {
      default: ['en-US'],
      'es-US': ['es-LA'],
    },
    resources: {
      'en-US': locales.enUS,
      'es-AR': locales.esAR,
    },
    ns: Object.keys(Namespaces),
    defaultNS: 'common',
    fallbackNS: 'common',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
  })
  .catch((reason: any) => logger.error(TAG, 'Failed init i18n', reason))

RNLanguages.addEventListener('change', ({ language }: { language: string }) => {
  i18n
    .changeLanguage(language)
    .catch((reason: any) => logger.error(TAG, 'Failed to change i18n language', reason))
})

export default i18n
