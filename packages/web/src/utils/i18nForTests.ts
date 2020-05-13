import { initReactI18next } from 'react-i18next'
import NextI18NextInstance, { NameSpaces } from 'src/i18n'

// tslint:disable-next-line: no-floating-promises
NextI18NextInstance.i18n.use(initReactI18next).init({
  load: 'all',
  fallbackLng: 'en',
  resources: {
    en: {
      [NameSpaces.about]: require('public/static/locales/en/about.json'),
      [NameSpaces.alliance]: require('public/static/locales/en/alliance.json'),
      [NameSpaces.applications]: require('public/static/locales/en/applications.json'),
      [NameSpaces.audits]: require('public/static/locales/en/audits.json'),
      [NameSpaces.brand]: require('public/static/locales/en/brand.json'),
      [NameSpaces.codeofconduct]: require('public/static/locales/en/codeofconduct.json'),
      [NameSpaces.community]: require('public/static/locales/en/community.json'),
      [NameSpaces.common]: require('public/static/locales/en/common.json'),
      [NameSpaces.dev]: require('public/static/locales/en/dev.json'),
      [NameSpaces.download]: require('public/static/locales/en/download.json'),
      [NameSpaces.faucet]: require('public/static/locales/en/faucet.json'),
      [NameSpaces.home]: require('public/static/locales/en/home.json'),
      [NameSpaces.jobs]: require('public/static/locales/en/jobs.json'),
      [NameSpaces.technology]: require('public/static/locales/en/technology.json'),
      [NameSpaces.terms]: require('public/static/locales/en/terms.json'),
      [NameSpaces.papers]: require('public/static/locales/en/papers.json'),
    },
  },
  // have a common namespace used around the full app
  ns: Object.keys(NameSpaces),
  defaultNS: NameSpaces.common,
  debug: false,
})

NextI18NextInstance.i18n.languages = ['en']

export default NextI18NextInstance
