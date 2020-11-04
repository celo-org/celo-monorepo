import { stringToBoolean } from '@celo/utils/src/parsing'
import BigNumber from 'bignumber.js'
import Config from 'react-native-config'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import { GethSyncMode } from 'src/geth/consts'
// tslint:disable-next-line
import * as secretsFile from '../secrets.json'

export * from 'src/brandingConfig'

// extract secrets from secrets.json
const keyOrUndefined = (file: any, secretsKey: any, attribute: any) => {
  if (secretsKey in file) {
    if (attribute in file[secretsKey]) {
      return file[secretsKey][attribute]
    }
  }
  return undefined
}

export const AVAILABLE_LANGUAGES = [
  { name: 'English', code: 'en-US' },
  { name: 'Español (América Latina)', code: 'es-419' },
]

// DEV only related settings
export const isE2EEnv = stringToBoolean(Config.IS_E2E || 'false')
export const DEV_RESTORE_NAV_STATE_ON_RELOAD = stringToBoolean(
  Config.DEV_RESTORE_NAV_STATE_ON_RELOAD || 'false'
)
export const DEV_SETTINGS_ACTIVE_INITIALLY = stringToBoolean(
  Config.DEV_SETTINGS_ACTIVE_INITIALLY || 'false'
)

// VALUES
export const GAS_INFLATION_FACTOR = 1.5 // Used when estimating gas for txs
export const GAS_PRICE_INFLATION_FACTOR = 5 // Used when getting gas price, must match what Geth does
export const BALANCE_OUT_OF_SYNC_THRESHOLD = 1 * 60 // 1 minute
export const ALERT_BANNER_DURATION = 5000
export const NUMBER_INPUT_MAX_DECIMALS = 2
export const MAX_COMMENT_LENGTH = 70
export const INPUT_DEBOUNCE_TIME = 1000 // milliseconds
// The minimum allowed value to add funds
export const DOLLAR_ADD_FUNDS_MIN_AMOUNT = 0.01
// The minimum allowed value to cash out
export const DOLLAR_CASH_OUT_MIN_AMOUNT = 0.01
// The minimum allowed value for a transaction such as a transfer
export const DOLLAR_TRANSACTION_MIN_AMOUNT = 0.01
export const GOLD_TRANSACTION_MIN_AMOUNT = 0.001
// The number of seconds before the sender can reclaim the payment.
export const ESCROW_PAYMENT_EXPIRY_SECONDS = 86400 // 1 days
export const DEFAULT_TESTNET = Config.DEFAULT_TESTNET
export const DAILY_PAYMENT_LIMIT_CUSD = 500
export const SMS_RETRIEVER_APP_SIGNATURE = Config.SMS_RETRIEVER_APP_SIGNATURE
// ODIS minimum dollar balance for pepper quota retrieval
// TODO change this to new ODIS minimum dollar balance once deployed
export const ODIS_MINIMUM_DOLLAR_BALANCE = 0.1
// When user goes to VerificationEducationScreen - we fetch current verification state.
// Then user decides on what to do and go to VerificationInputScreen.
// If user were "deciding" for more than VERIFICATION_STATE_EXPIRY_SECONDS, then
// we would refetch verification state before going to VerificationInputScreen
export const VERIFICATION_STATE_EXPIRY_SECONDS = 30

export const ATTESTATION_REVEAL_TIMEOUT_SECONDS = 60 // 1 minute

// TODO: remove special case for mainnet
export const DEFAULT_FORNO_URL = `https://${
  DEFAULT_TESTNET === 'mainnet' ? 'rc1' : DEFAULT_TESTNET
}-forno.celo-testnet.org`

// FEATURE FLAGS
export const FIREBASE_ENABLED = stringToBoolean(Config.FIREBASE_ENABLED || 'true')
export const SHOW_TESTNET_BANNER = stringToBoolean(Config.SHOW_TESTNET_BANNER || 'false')
export const SHOW_GET_INVITE_LINK = stringToBoolean(Config.SHOW_GET_INVITE_LINK || 'false')
export const FORNO_ENABLED_INITIALLY = Config.FORNO_ENABLED_INITIALLY
  ? stringToBoolean(Config.FORNO_ENABLED_INITIALLY)
  : false
export const DEFAULT_SYNC_MODE: GethSyncMode = Config.DEFAULT_SYNC_MODE
  ? new BigNumber(Config.DEFAULT_SYNC_MODE).toNumber()
  : GethSyncMode.Lightest
export const GETH_USE_FULL_NODE_DISCOVERY = stringToBoolean(
  Config.GETH_USE_FULL_NODE_DISCOVERY || 'true'
)
export const GETH_USE_STATIC_NODES = stringToBoolean(Config.GETH_USE_STATIC_NODES || 'true')
// NOTE: Development purposes only
export const GETH_START_HTTP_RPC_SERVER = stringToBoolean(
  Config.GETH_START_HTTP_RPC_SERVER || 'false'
)

// SECRETS
export const SEGMENT_API_KEY = keyOrUndefined(secretsFile, Config.SECRETS_KEY, 'SEGMENT_API_KEY')
export const FIREBASE_WEB_KEY = keyOrUndefined(secretsFile, Config.SECRETS_KEY, 'FIREBASE_WEB_KEY')
export const SENTRY_URL = keyOrUndefined(secretsFile, Config.SECRETS_KEY, 'SENTRY_URL')
export const MOONPAY_PUBLIC_KEY = keyOrUndefined(
  secretsFile,
  Config.SECRETS_KEY,
  'MOONPAY_PUBLIC_KEY'
)
export const RECAPTCHA_SITE_KEY = keyOrUndefined(
  secretsFile,
  Config.SECRETS_KEY,
  'RECAPTCHA_SITE_KEY'
)
export const SAFETYNET_KEY = keyOrUndefined(secretsFile, Config.SECRETS_KEY, 'SAFETYNET_KEY')
export const MOONPAY_RATE_API = `https://api.moonpay.io/v3/currencies/celo/price?apiKey=${MOONPAY_PUBLIC_KEY}`

export const EXCHANGE_PROVIDER_LINKS: ExternalExchangeProvider[] = [
  {
    name: 'Bittrex (CELO)',
    link: 'https://bittrex.com/Market/Index?MarketName=USD-CELO',
  },
  {
    name: 'OKCoin (CELO, CUSD)',
    link: 'https://www.okcoin.com/en/spot/trade/cusd-usd/',
  },
  {
    name: 'OKEx (CELO)',
    link: 'https://www.okex.com/spot/trade/CELO-USDT',
  },
  {
    name: 'CoinList Pro (CELO)',
    link: 'https://coinlist.co/asset/celo',
  },
  {
    name: 'Coinbase Pro (CELO as CGLD)',
    link: 'https://pro.coinbase.com/trade/CGLD-USD',
  },
  {
    name: 'Coinbase (CELO as CGLD)',
    link: 'https://www.coinbase.com',
  },
]

export const SIMPLEX_URI = 'https://valoraapp.com/simplex'

export const APP_STORE_ID = Config.APP_STORE_ID
export const DYNAMIC_LINK_DOMAIN = Config.DYNAMIC_LINK_DOMAIN
