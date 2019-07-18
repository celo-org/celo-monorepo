import i18n from 'i18next'
import locales, { Namespaces } from 'locales'
import { reactI18nextModule } from 'react-i18next'
import RNLanguages from 'react-native-languages'

const languageDetector = {
  type: 'languageDetector',
  async: false,
  detect: () => {
    return RNLanguages.language
  },
  // tslint:disable-next-line
  init: () => {},
  // tslint:disable-next-line
  cacheUserLanguage: () => {},
}

i18n
  .use(languageDetector)
  .use(reactI18nextModule)
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

RNLanguages.addEventListener('change', ({ language }: { language: string }) => {
  i18n.changeLanguage(language)
})

export default i18n
