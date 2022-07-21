import { OdisUtils } from '@celo/identity'
import { rootLogger as logger, TestUtils, toBool } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions'
export const VERSION = process.env.npm_package_version ?? ''
export const DEV_MODE =
  process.env.NODE_ENV !== 'production' || process.env.FUNCTIONS_EMULATOR === 'true'

export const FORNO_ALFAJORES = 'https://alfajores-forno.celo-testnet.org'

// combiner always thinks these accounts/phoneNumbersa are verified to enable e2e testing
export const E2E_TEST_PHONE_NUMBERS_RAW: string[] = ['+14155550123', '+15555555555', '+14444444444']
export const E2E_TEST_PHONE_NUMBERS: string[] = E2E_TEST_PHONE_NUMBERS_RAW.map((num) =>
  OdisUtils.Matchmaking.obfuscateNumberForMatchmaking(num)
)
export const E2E_TEST_ACCOUNTS: string[] = ['0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb']

export interface BlockchainConfig {
  provider: string
  apiKey?: string
}

export interface DatabaseConfig {
  user: string
  password: string
  database: string
  host: string
  ssl: boolean
}

export interface OdisConfig {
  enabled: boolean
  odisServices: {
    signers: string
    timeoutMilliSeconds: number
  }
  keys: {
    version: number
    threshold: number
    polynomial: string
    pubKey: string
  }
}

export interface CloudFunctionConfig {
  minInstances: number
}

export interface CombinerConfig {
  blockchain: BlockchainConfig
  db: DatabaseConfig
  phoneNumberPrivacy: OdisConfig
  domains: OdisConfig
  cloudFunction: CloudFunctionConfig
}

let config: CombinerConfig

if (DEV_MODE) {
  logger().debug('Running in dev mode')
  config = {
    blockchain: {
      provider: FORNO_ALFAJORES,
    },
    db: {
      user: 'postgres',
      password: 'fakePass',
      database: 'phoneNumberPrivacy',
      host: 'fakeHost',
      ssl: false,
    },
    phoneNumberPrivacy: {
      enabled: true,
      odisServices: {
        // TODO(Alec): For testing, use app.listen(3000)
        signers:
          '[{"url": "http://localhost:3000", "fallbackUrl": "http://localhost:3000/fallback"}, {"url": "http://localhost:3001", "fallbackUrl": "http://localhost:3001/fallback"}, {"url": "http://localhost:3002", "fallbackUrl": "http://localhost:3002/fallback"}]',
        timeoutMilliSeconds: 5 * 1000,
      },
      keys: {
        version: 1,
        threshold: 1,
        polynomial: TestUtils.Values.PNP_DEV_ODIS_POLYNOMIAL,
        pubKey: TestUtils.Values.PNP_DEV_ODIS_PUBLIC_KEY,
      },
    },
    domains: {
      enabled: true,
      odisServices: {
        signers:
          '[{"url": "http://localhost:3000", "fallbackUrl": "http://localhost:3000/fallback"}, {"url": "http://localhost:3001", "fallbackUrl": "http://localhost:3001/fallback"}, {"url": "http://localhost:3002", "fallbackUrl": "http://localhost:3002/fallback"}]',
        timeoutMilliSeconds: 5 * 1000,
      },
      keys: {
        version: 1,
        threshold: 1,
        polynomial: TestUtils.Values.DOMAINS_DEV_ODIS_POLYNOMIAL,
        pubKey: TestUtils.Values.DOMAINS_DEV_ODIS_PUBLIC_KEY,
      },
    },
    cloudFunction: {
      minInstances: 0,
    },
  }
} else {
  const functionConfig = functions.config()
  config = {
    blockchain: {
      provider: functionConfig.blockchain.provider,
      apiKey: functionConfig.blockchain.api_key,
    },
    db: {
      user: functionConfig.db.username,
      password: functionConfig.db.pass,
      database: functionConfig.db.name,
      host: `/cloudsql/${functionConfig.db.host}`,
      ssl: toBool(functionConfig.db.ssl, true),
    },
    phoneNumberPrivacy: {
      enabled: toBool(functionConfig.phoneNumberPrivacy.enabled, false),
      odisServices: {
        signers: functionConfig.phoneNumberPrivacy.odisservices.signers,
        timeoutMilliSeconds:
          functionConfig.phoneNumberPrivacy.odisservices.timeoutMilliSeconds ?? 5 * 1000,
      },
      keys: {
        version: functionConfig.phoneNumberPrivacy.keys.version,
        threshold: functionConfig.phoneNumberPrivacy.keys.threshold,
        polynomial: functionConfig.phoneNumberPrivacy.keys.polynomial,
        pubKey: functionConfig.phoneNumberPrivacy.keys.pubKey,
      },
    },
    domains: {
      enabled: toBool(functionConfig.domains.enabled, false),
      odisServices: {
        signers: functionConfig.domains.odisservices.signers,
        timeoutMilliSeconds: functionConfig.domains.odisservices.timeoutMilliSeconds ?? 5 * 1000,
      },
      keys: {
        version: functionConfig.domains.keys.version,
        threshold: functionConfig.domains.keys.threshold,
        polynomial: functionConfig.domains.keys.polynomial,
        pubKey: functionConfig.domains.keys.pubKey,
      },
    },
    cloudFunction: {
      // Keep instances warm for mainnet functions
      // @ts-ignore https://firebase.google.com/docs/functions/manage-functions#reduce_the_number_of_cold_starts
      minInstances: functionConfig.blockchain.provider === FORNO_ALFAJORES ? 0 : 3,
    },
  }
}
export default config
