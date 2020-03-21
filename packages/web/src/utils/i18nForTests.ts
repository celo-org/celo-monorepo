import NextI18NextInstance from 'src/i18n'

import { initReactI18next } from 'react-i18next'

import { NameSpaces } from 'src/i18n'
// tslint:disable-next-line: no-floating-promises
NextI18NextInstance.i18n.use(initReactI18next).init({
  load: 'all',
  fallbackLng: 'en',
  resources: {
    en: {
      [NameSpaces.common]: require('public/static/locales/en/common.json'),
      [NameSpaces.home]: require('public/static/locales/en/home.json'),
    },
  },
  // have a common namespace used around the full app
  ns: Object.keys(NameSpaces),
  defaultNS: NameSpaces.common,
  debug: true,

  interpolation: {
    escapeValue: false, // not needed for react!!
  },
})

export default NextI18NextInstance
