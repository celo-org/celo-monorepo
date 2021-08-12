import { OdisUtils } from '@celo/identity'
import { rootLogger as logger, toBool } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions'
export const VERSION = process.env.npm_package_version
export const DEV_MODE =
  process.env.NODE_ENV !== 'production' || process.env.FUNCTIONS_EMULATOR === 'true'

export const DEV_PUBLIC_KEY =
  '1f33136ac029a702eb041096bd9ef09dc9c368dde52a972866bdeaff0896f8596b74ab7adfd7318bba38527599768400df44bcab66bcf3843c17a2ce838bcd5a8ba1634c18314ff0565a7c769905b8a8fba27a86bf4c6cb22df89e1badfe2b81'
export const DEV_PRIVATE_KEY =
  '00000000dd0005bf4de5f2f052174f5cf58dae1af1d556c7f7f85d6fb3656e1d0f10720f'
export const DEV_POLYNOMIAL =
  '01000000000000001f33136ac029a702eb041096bd9ef09dc9c368dde52a972866bdeaff0896f8596b74ab7adfd7318bba38527599768400df44bcab66bcf3843c17a2ce838bcd5a8ba1634c18314ff0565a7c769905b8a8fba27a86bf4c6cb22df89e1badfe2b81'

export const FORNO_ALFAJORES = 'https://alfajores-forno.celo-testnet.org'

// combiner always thinks these accounts/phoneNumbersa are verified to enable e2e testing
export const E2E_TEST_PHONE_NUMBERS_RAW: string[] = ['+14155550123', '+15555555555', '+14444444444']
export const E2E_TEST_PHONE_NUMBERS: string[] = E2E_TEST_PHONE_NUMBERS_RAW.map((num) =>
  OdisUtils.Matchmaking.obfuscateNumberForMatchmaking(num)
)
export const E2E_TEST_ACCOUNTS: string[] = ['0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb']

interface Config {
  blockchain: {
    provider: string
  }
  db: {
    user: string
    password: string
    database: string
    host: string
    ssl: boolean
  }
  odisServices: {
    signers: string
    timeoutMilliSeconds: number
  }
  thresholdSignature: {
    threshold: number
    polynomial: string
  }
}

let config: Config

if (DEV_MODE) {
  logger.debug('Running in dev mode')
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
    odisServices: {
      signers: '[{"url": "http://localhost:3000"}]',
      timeoutMilliSeconds: 5 * 1000,
    },
    thresholdSignature: {
      threshold: 1,
      polynomial: DEV_POLYNOMIAL,
    },
  }
} else {
  const functionConfig = functions.config()
  config = {
    blockchain: {
      provider: functionConfig.blockchain.provider,
    },
    db: {
      user: functionConfig.db.username,
      password: functionConfig.db.pass,
      database: functionConfig.db.name,
      host: `/cloudsql/${functionConfig.db.host}`,
      ssl: toBool(functionConfig.db.ssl, true),
    },
    odisServices: {
      signers: functionConfig.odisservices.signers,
      timeoutMilliSeconds: functionConfig.odisservices.timeoutMilliSeconds || 5 * 1000,
    },
    thresholdSignature: {
      threshold: functionConfig.threshold_signature.threshold_signature_threshold,
      polynomial: functionConfig.threshold_signature.threshold_polynomial,
    },
  }
}
export default config
