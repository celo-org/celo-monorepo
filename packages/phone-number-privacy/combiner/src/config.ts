import {
  BlockchainConfig,
  FULL_NODE_TIMEOUT_IN_MS,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
  rootLogger,
  TestUtils,
  toBool,
} from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions'
export function getCombinerVersion(): string {
  return process.env.npm_package_version ?? require('../package.json').version ?? '0.0.0'
}
export const DEV_MODE =
  process.env.NODE_ENV !== 'production' || process.env.FUNCTIONS_EMULATOR === 'true'

export const FORNO_ALFAJORES = 'https://alfajores-forno.celo-testnet.org'

// combiner always thinks these accounts/phoneNumbersa are verified to enable e2e testing
export const E2E_TEST_PHONE_NUMBERS_RAW: string[] = ['+14155550123', '+15555555555', '+14444444444']

export const E2E_TEST_ACCOUNTS: string[] = ['0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb']

export const MAX_BLOCK_DISCREPANCY_THRESHOLD = 3
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
}
export interface ProxyConfig {
  deploymentEnv: string
  forwardToGen2: boolean
}
export interface CombinerConfig {
  serviceName: string
  blockchain: BlockchainConfig
  phoneNumberPrivacy: OdisConfig
  domains: OdisConfig
  proxy: ProxyConfig
}

let config: CombinerConfig

const defaultServiceName = 'odis-combiner'

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
    },
    proxy: {
      forwardToGen2: false,
      deploymentEnv: 'local',
    },
  }
} else {
  const functionConfig = functions.config()
  config = {
    serviceName: functionConfig.service.name ?? defaultServiceName,
    blockchain: {
      provider: functionConfig.blockchain.provider,
      apiKey: functionConfig.blockchain.api_key,
    },
    phoneNumberPrivacy: {
      serviceName: functionConfig.pnp.service_name ?? defaultServiceName,
      enabled: toBool(functionConfig.pnp.enabled, false),
      odisServices: {
        signers: functionConfig.pnp.odisservices,
        timeoutMilliSeconds: functionConfig.pnp.timeout_ms
          ? Number(functionConfig.pnp.timeout_ms)
          : 5 * 1000,
      },
      keys: {
        currentVersion: Number(functionConfig.pnp_keys.current_version),
        versions: functionConfig.pnp_keys.versions,
      },
      fullNodeTimeoutMs: Number(functionConfig.pnp.full_node_timeout_ms ?? FULL_NODE_TIMEOUT_IN_MS),
      fullNodeRetryCount: Number(functionConfig.pnp.full_node_retry_count ?? RETRY_COUNT),
      fullNodeRetryDelayMs: Number(
        functionConfig.pnp.full_node_retry_delay_ms ?? RETRY_DELAY_IN_MS
      ),
      shouldAuthenticate: toBool(functionConfig.pnp.should_authenticate, true),
    },
    domains: {
      serviceName: functionConfig.domains.service_name ?? defaultServiceName,
      enabled: toBool(functionConfig.domains.enabled, false),
      odisServices: {
        signers: functionConfig.domains.odisservices,
        timeoutMilliSeconds: functionConfig.domains.timeout_ms
          ? Number(functionConfig.domains.timeout_ms)
          : 5 * 1000,
      },
      keys: {
        currentVersion: Number(functionConfig.domains_keys.current_version),
        versions: functionConfig.domains_keys.versions,
      },
      fullNodeTimeoutMs: Number(
        functionConfig.domains.full_node_timeout_ms ?? FULL_NODE_TIMEOUT_IN_MS
      ), // TODO refactor config - domains endpoints don't use full node
      fullNodeRetryCount: Number(functionConfig.domains.full_node_retry_count ?? RETRY_COUNT),
      fullNodeRetryDelayMs: Number(
        functionConfig.domains.full_node_retry_delay_ms ?? RETRY_DELAY_IN_MS
      ),
      shouldAuthenticate: true,
    },
    proxy: {
      forwardToGen2: toBool(functionConfig.proxy.forward_to_gen2, false),
      deploymentEnv: functionConfig.proxy.deployment_env,
    },
  }
}
export default config
