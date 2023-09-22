import { ensureLeading0x } from '@celo/base'
import {
  BlockchainConfig,
  FULL_NODE_TIMEOUT_IN_MS,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
  rootLogger,
  TestUtils,
  toBool,
} from '@celo/phone-number-privacy-common'

export function getCombinerVersion(): string {
  return process.env.npm_package_version ?? require('../package.json').version ?? '0.0.0'
}
export const DEV_MODE = process.env.NODE_ENV !== 'production'

export const FORNO_ALFAJORES = 'https://alfajores-forno.celo-testnet.org'

export const E2E_TEST_ACCOUNTS: string[] = ['0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb']

export const MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD = 5
export const MAX_QUERY_COUNT_DISCREPANCY_THRESHOLD = 5

export interface OdisConfig {
  serviceName: string
  enabled: boolean
  odisServices: {
    signers: string
    timeoutMilliSeconds: number
  }
  keys: {
    currentVersion: number
    versions: string // parse as KeyVersionInfo[]
  }
  fullNodeTimeoutMs: number
  fullNodeRetryCount: number
  fullNodeRetryDelayMs: number
  shouldAuthenticate: boolean
  shouldCheckQuota: boolean
  shouldMockAccountService?: boolean
  mockDek?: string
}

export interface CombinerConfig {
  serviceName: string
  server: {
    port: string | number | undefined
    sslKeyPath?: string
    sslCertPath?: string
  }
  blockchain: BlockchainConfig
  phoneNumberPrivacy: OdisConfig
  domains: OdisConfig
}

export let config: CombinerConfig

const defaultServiceName = 'odis-combiner'
const defaultMockDEK = ensureLeading0x(
  'bf8a2b73baf8402f8fe906ad3f42b560bf14b39f7df7797ece9e293d6f162188'
)

if (DEV_MODE) {
  rootLogger(defaultServiceName).debug('Running in dev mode')
  const devSignersString = JSON.stringify([
    {
      url: 'http://localhost:3001',
      fallbackUrl: 'http://localhost:3001/fallback',
    },
    {
      url: 'http://localhost:3002',
      fallbackUrl: 'http://localhost:3002/fallback',
    },
    {
      url: 'http://localhost:3003',
      fallbackUrl: 'http://localhost:3003/fallback',
    },
  ])
  config = {
    serviceName: defaultServiceName,
    server: {
      port: 8080,
    },
    blockchain: {
      provider: FORNO_ALFAJORES,
    },
    phoneNumberPrivacy: {
      serviceName: defaultServiceName,
      enabled: true,
      odisServices: {
        signers: devSignersString,
        timeoutMilliSeconds: 5 * 1000,
      },
      keys: {
        currentVersion: 1,
        versions: JSON.stringify([
          {
            keyVersion: 1,
            threshold: 2,
            polynomial: TestUtils.Values.PNP_THRESHOLD_DEV_POLYNOMIAL_V1,
            pubKey: TestUtils.Values.PNP_THRESHOLD_DEV_PUBKEY_V1,
          },
          {
            keyVersion: 2,
            threshold: 2,
            polynomial: TestUtils.Values.PNP_THRESHOLD_DEV_POLYNOMIAL_V2,
            pubKey: TestUtils.Values.PNP_THRESHOLD_DEV_PUBKEY_V2,
          },
          {
            keyVersion: 3,
            threshold: 2,
            polynomial: TestUtils.Values.PNP_THRESHOLD_DEV_POLYNOMIAL_V3,
            pubKey: TestUtils.Values.PNP_THRESHOLD_DEV_PUBKEY_V3,
          },
        ]),
      },
      fullNodeTimeoutMs: FULL_NODE_TIMEOUT_IN_MS,
      fullNodeRetryCount: RETRY_COUNT,
      fullNodeRetryDelayMs: RETRY_DELAY_IN_MS,
      shouldAuthenticate: true,
      shouldCheckQuota: false,
      mockDek: defaultMockDEK,
    },
    domains: {
      serviceName: defaultServiceName,
      enabled: true,
      odisServices: {
        signers: devSignersString,
        timeoutMilliSeconds: 5 * 1000,
      },
      keys: {
        currentVersion: 1,
        versions: JSON.stringify([
          {
            keyVersion: 1,
            threshold: 2,
            polynomial: TestUtils.Values.DOMAINS_THRESHOLD_DEV_POLYNOMIAL_V1,
            pubKey: TestUtils.Values.DOMAINS_THRESHOLD_DEV_PUBKEY_V1,
          },
          {
            keyVersion: 2,
            threshold: 2,
            polynomial: TestUtils.Values.DOMAINS_THRESHOLD_DEV_POLYNOMIAL_V2,
            pubKey: TestUtils.Values.DOMAINS_THRESHOLD_DEV_PUBKEY_V2,
          },
          {
            keyVersion: 3,
            threshold: 2,
            polynomial: TestUtils.Values.DOMAINS_THRESHOLD_DEV_POLYNOMIAL_V3,
            pubKey: TestUtils.Values.DOMAINS_THRESHOLD_DEV_PUBKEY_V3,
          },
        ]),
      },
      fullNodeTimeoutMs: FULL_NODE_TIMEOUT_IN_MS,
      fullNodeRetryCount: RETRY_COUNT,
      fullNodeRetryDelayMs: RETRY_DELAY_IN_MS,
      shouldAuthenticate: true,
      shouldCheckQuota: false,
    },
  }
} else {
  const env = process.env as any
  config = {
    serviceName: env.SERVICE_NAME ?? defaultServiceName,
    server: {
      port: Number(env.SERVER_PORT ?? 8080),
      sslKeyPath: env.SERVER_SSL_KEY_PATH,
      sslCertPath: env.SERVER_SSL_CERT_PATH,
    },
    blockchain: {
      provider: env.BLOCKCHAIN_PROVIDER,
      apiKey: env.BLOCKCHAIN_API_KEY,
    },
    phoneNumberPrivacy: {
      serviceName: env.SERVICE_NAME ?? defaultServiceName,
      enabled: toBool(env.PHONE_NUMBER_PRIVACY_API_ENABLED, false),
      odisServices: {
        signers: env.PNP_ODIS_SERVICES_SIGNERS,
        timeoutMilliSeconds: Number(env.PNP_ODIS_SERVICES_TIMEOUT_MILLISECONDS ?? 5 * 1000),
      },
      keys: {
        currentVersion: Number(env.PNP_KEYS_CURRENT_VERSION ?? 1),
        versions: env.PNP_KEYS_VERSIONS,
      },
      fullNodeTimeoutMs: Number(env.PNP_FULL_NODE_TIMEOUT_MS ?? FULL_NODE_TIMEOUT_IN_MS),
      fullNodeRetryCount: Number(env.PNP_FULL_NODE_RETRY_COUNT ?? RETRY_COUNT),
      fullNodeRetryDelayMs: Number(env.PNP_FULL_NODE_DELAY_MS ?? RETRY_DELAY_IN_MS),
      shouldAuthenticate: toBool(env.PNP_SHOULD_AUTHENTICATE, true),
      shouldCheckQuota: toBool(env.PNP_SHOULD_CHECK_QUOTA, false),
      shouldMockAccountService: toBool(env.PNP_SHOULD_MOCK_ACCOUNT_SERVICE, false),
      mockDek: env.PNP_MOCK_DEK ?? defaultMockDEK,
    },
    domains: {
      serviceName: env.SERVICE_NAME ?? defaultServiceName,
      enabled: toBool(env.DOMAINS_API_ENABLED, false),
      odisServices: {
        signers: env.DOMAIN_ODIS_SERVICES_SIGNERS,
        timeoutMilliSeconds: Number(env.DOMAIN_ODIS_SERVICES_TIMEOUT_MILLISECONDS ?? 5 * 1000),
      },
      keys: {
        currentVersion: Number(env.DOMAIN_KEYS_CURRENT_VERSION ?? 1),
        versions: env.DOMAIN_KEYS_VERSIONS,
      },
      fullNodeTimeoutMs: Number(env.DOMAIN_FULL_NODE_TIMEOUT_MS ?? FULL_NODE_TIMEOUT_IN_MS),
      fullNodeRetryCount: Number(env.DOMAIN_FULL_NODE_RETRY_COUNT ?? RETRY_COUNT),
      fullNodeRetryDelayMs: Number(env.DOMAIN_FULL_NODE_DELAY_MS ?? RETRY_DELAY_IN_MS),
      shouldAuthenticate: toBool(env.PNP_SHOULD_AUTHENTICATE, true),
      shouldCheckQuota: toBool(env.PNP_SHOULD_CHECK_QUOTA, false),
      shouldMockAccountService: toBool(env.PNP_SHOULD_MOCK_ACCOUNT_SERVICE, false),
      mockDek: env.PNP_MOCK_DEK ?? defaultMockDEK, // TODO refactor configs
    },
  }
}
export default config
