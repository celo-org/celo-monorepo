import NextI18Next, { I18nProps as i18nProps } from 'next-i18next'

const options = { defaultLanguage: 'en', otherLanguages: ['en'], saveMissing: false }
const NextI18NextInstance = new NextI18Next(options)

export const Trans = NextI18NextInstance.Trans

export interface I18nProps {
  t: i18nProps['t']
  i18n: i18nProps['i18n']
}

export default NextI18NextInstance
export const { appWithTranslation, withNamespaces } = NextI18NextInstance

export enum NameSpaces {
  common = 'common',
  about = 'about',
  applications = 'applications',
  codeofconduct = 'codeofconduct',
  community = 'community',
  download = 'download',
  dev = 'dev',
  faucet = 'faucet',
  home = 'home',
  jobs = 'jobs',
  terms = 'terms',
  technology = 'technology',
}
