import Config from 'react-native-config'

export const DEV_SETTINGS_ACTIVE_INITIALLY =
  Config.DEV_SETTINGS_ACTIVE_INITIALLY &&
  Config.DEV_SETTINGS_ACTIVE_INITIALLY.toLowerCase() === 'true'

export const DEFAULT_TESTNET = Config.DEFAULT_TESTNET || null

export const CELO_SUPPORT_EMAIL_ADDRESS = 'support@celo.org'

export const BLOCKCHAIN_API_URL = Config.BLOCKCHAIN_API_URL
