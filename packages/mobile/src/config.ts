import { stringToBoolean } from '@celo/utils/src/parsing'
import Config from 'react-native-config'
import config from 'src/geth/network-config'
import { Testnets } from 'src/web3/testnets'
// if I use @celo/utils breaks all the tests for some reason
// tslint:disable-next-line
import * as secretsFile from '../secrets.json'

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

export const isE2EEnv = Config.IS_E2E || false
export const CELO_VERIFIER_DOWNLOAD_LINK = 'https://celo.org/rewards'
export const CELO_VERIFIER_START_MINING_LINK = 'celo://verifier/start'
export const CELO_FAUCET_LINK = 'https://celo.org/build/wallet'
export const CELO_TERMS_LINK = 'https://celo.org/terms'

export const DEFAULT_COUNTRY = Config.DEFAULT_COUNTRY || null

export const TOS_LINK = 'https://celo.org/user-agreement'
export const FAQ_LINK = 'https://celo.org/faq'

export const CELO_SUPPORT_EMAIL_ADDRESS = 'support@celo.org'

export const BALANCE_OUT_OF_SYNC_THRESHOLD = 5 * 60 // 5 minutes

export const ALERT_BANNER_DURATION = 5000

export const NUMBER_INPUT_MAX_DECIMALS = 2
export const MAX_COMMENT_LENGTH = 70

export const INPUT_DEBOUNCE_TIME = 1000 // milliseconds

export const DEV_SETTINGS_ACTIVE_INITIALLY = stringToBoolean(
  Config.DEV_SETTINGS_ACTIVE_INITIALLY || 'false'
)

export const FIREBASE_ENABLED = stringToBoolean(Config.FIREBASE_ENABLED || 'true')

// We need to fallback to `integration` for testing under jest where
// react-native-config is undefined.
export const DEFAULT_TESTNET: Testnets = Config.DEFAULT_TESTNET || 'integration'
export const BLOCKCHAIN_API_URL = config[DEFAULT_TESTNET].blockchainApiUrl
export const DEFAULT_INFURA_URL = `https://${DEFAULT_TESTNET}-infura.celo-testnet.org/`

export const SEGMENT_API_KEY = keyOrUndefined(secretsFile, Config.SECRETS_KEY, 'SEGMENT_API_KEY')
export const FIREBASE_WEB_KEY = keyOrUndefined(secretsFile, Config.SECRETS_KEY, 'FIREBASE_WEB_KEY')

export const SENTRY_URL = keyOrUndefined(secretsFile, Config.SECRETS_KEY, 'SENTRY_URL')

export const PROMOTE_REWARDS_APP = false

// The number of seconds before the sender can reclaim the payment.
export const ESCROW_PAYMENT_EXPIRY_SECONDS = 172800 // 2 days

export const SHOW_TESTNET_BANNER = stringToBoolean(Config.SHOW_TESTNET_BANNER || 'false')

// The minimum allowed value for a transaction such as a transfer
export const DOLLAR_TRANSACTION_MIN_AMOUNT = 0.01
export const GOLD_TRANSACTION_MIN_AMOUNT = 0.001
