import locales from '@celo/mobile/locales'
import { currencyTranslations } from '@celo/utils/src/currencies'
import hoistStatics from 'hoist-non-react-statics'
import i18n, { LanguageDetectorModule } from 'i18next'
import {
  initReactI18next,
  WithTranslation,
  withTranslation as withTranslationI18Next,
  WithTranslationProps,
} from 'react-i18next'
import * as RNLocalize from 'react-native-localize'
import Logger from 'src/utils/Logger'

const TAG = 'i18n'

export enum Namespaces {
  accountScreen10 = 'accountScreen10',
  backupKeyFlow6 = 'backupKeyFlow6',
  exchangeFlow9 = 'exchangeFlow9',
  global = 'global',
  index = 'index',
  inviteFlow11 = 'inviteFlow11',
  nuxCurrencyPhoto4 = 'nuxCurrencyPhoto4',
  nuxNamePin1 = 'nuxNamePin1',
  nuxRestoreWallet3 = 'nuxRestoreWallet3',
  nuxVerification2 = 'nuxVerification2',
  receiveFlow8 = 'receiveFlow8',
  sendFlow7 = 'sendFlow7',
  paymentRequestFlow = 'paymentRequestFlow',
  walletFlow5 = 'walletFlow5',
  dappkit = 'dappkit',
}

const availableResources = {
  'en-US': {
    ...locales.enUS,
  },
  'es-419': {
    ...locales.es_419,
  },
}

function getLanguage() {
  const fallback = { languageTag: 'en', isRTL: false }
  const { languageTag } =
    RNLocalize.findBestAvailableLanguage(Object.keys(availableResources)) || fallback
  return languageTag
}

const languageDetector: LanguageDetectorModule = {
  type: 'languageDetector',
  detect: getLanguage,
  init: () => {
    Logger.debug(TAG, 'Initing language detector')
  },
  cacheUserLanguage: (lng: string) => {
    Logger.debug(TAG, `Skipping user language cache ${lng}`)
  },
}

const currencyInterpolator = (text: string, value: any) => {
  const key = value[1]
  const translations = currencyTranslations[i18n.language]

  if (translations && key in translations) {
    return translations[key]
  } else {
    Logger.warn(
      '@currencyInterpolator',
      `Unexpected currency interpolation: ${text} in ${i18n.language}`
    )
    return ''
  }
}

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: {
      default: ['en-US'],
      'es-US': ['es-LA'],
    },
    resources: availableResources,
    ns: ['common', ...Object.keys(Namespaces)],
    defaultNS: 'common',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    missingInterpolationHandler: currencyInterpolator,
  })
  .catch((reason: any) => Logger.error(TAG, 'Failed init i18n', reason))

RNLocalize.addEventListener('change', () => {
  i18n
    .changeLanguage(getLanguage())
    .catch((reason: any) => Logger.error(TAG, 'Failed to change i18n language', reason))
})

// Create HOC wrapper that hoists statics
// https://react.i18next.com/latest/withtranslation-hoc#hoist-non-react-statics
export const withTranslation = (namespace: Namespaces) => <P extends WithTranslation>(
  component: React.ComponentType<P>
): React.ComponentType<Omit<P, keyof WithTranslation> & WithTranslationProps> =>
  // cast as `any` here otherwise TypeScript complained
  hoistStatics(withTranslationI18Next(namespace)(component), component as any)

export default i18n
