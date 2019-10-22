import locales from '@celo/mobile/locales'
import en_US from '@celo/mobile/locales/en.json'
import es_LA from '@celo/mobile/locales/es.json'
import { currencyTranslations } from '@celo/utils/src/currencies'
// @ts-ignore
import i18n from 'i18next'
import { reactI18nextModule } from 'react-i18next'
import * as RNLocalize from 'react-native-localize'
import Logger from 'src/utils/Logger'

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
    common: en_US,
    ...locales.enUS,
  },
  'es-419': {
    common: es_LA,
    ...locales.es_419,
  },
}

function getLanguage() {
  const fallback = { languageTag: 'en', isRTL: false }
  const { languageTag } =
    RNLocalize.findBestAvailableLanguage(Object.keys(availableResources)) || fallback
  return languageTag
}

const languageDetector = {
  type: 'languageDetector',
  async: false,
  detect: getLanguage,
  // tslint:disable-next-line
  init: () => {},
  // tslint:disable-next-line
  cacheUserLanguage: () => {},
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
  .use(reactI18nextModule)
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

RNLocalize.addEventListener('change', () => {
  i18n.changeLanguage(getLanguage())
})

export default i18n
