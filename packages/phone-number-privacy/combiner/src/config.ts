import {
  BlockchainConfig,
  FULL_NODE_TIMEOUT_IN_MS,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
  rootLogger,
  TestUtils,
} from '@celo/phone-number-privacy-common'
import {
  blockchainApiKey,
  blockchainProvider,
  domainEnabled,
  domainFullNodeDelaysMs,
  domainFullNodeRetryCount,
  domainFullNodeTimeoutMs,
  domainKeysCurrentVersion,
  domainKeysVersions,
  domainOdisServicesSigners,
  domainOdisServicesTimeoutMilliseconds,
  domainServiceName,
  pnpEnabled,
  pnpFullNodeDelaysMs,
  pnpFullNodeRetryCount,
  pnpFullNodeTimeoutMs,
  pnpKeysCurrentVersion,
  pnpKeysVersions,
  pnpMockDek,
  pnpOdisServicesSigners,
  pnpOdisServicesTimeoutMilliseconds,
  pnpServiceName,
  pnpShouldMockAccountService,
  serviceNameConfig,
} from './utils/firebase-configs'

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
  shouldMockAccountService?: boolean
  mockDek?: string
}

export interface CombinerConfig {
  serviceName: string
  blockchain: BlockchainConfig
  phoneNumberPrivacy: OdisConfig
  domains: OdisConfig
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
    },
  }
} else {
  config = {
    serviceName: serviceNameConfig.value(),
    blockchain: {
      provider: blockchainProvider.value(),
      apiKey: blockchainApiKey.value(),
    },
    phoneNumberPrivacy: {
      serviceName: pnpServiceName.value(),
      enabled: pnpEnabled.value(),
      odisServices: {
        signers: pnpOdisServicesSigners.value(),
        timeoutMilliSeconds: pnpOdisServicesTimeoutMilliseconds.value(),
      },
      keys: {
        currentVersion: pnpKeysCurrentVersion.value(),
        versions: pnpKeysVersions.value(),
      },
      fullNodeTimeoutMs: pnpFullNodeTimeoutMs.value(),
      fullNodeRetryCount: pnpFullNodeRetryCount.value(),
      fullNodeRetryDelayMs: pnpFullNodeDelaysMs.value(),
      shouldMockAccountService: pnpShouldMockAccountService.value(),
      mockDek: pnpMockDek.value(),
    },
    domains: {
      serviceName: domainServiceName.value(),
      enabled: domainEnabled.value(),
      odisServices: {
        signers: domainOdisServicesSigners.value(),
        timeoutMilliSeconds: domainOdisServicesTimeoutMilliseconds.value(),
      },
      keys: {
        currentVersion: domainKeysCurrentVersion.value(),
        versions: domainKeysVersions.value(),
      },
      fullNodeTimeoutMs: domainFullNodeTimeoutMs.value(),
      fullNodeRetryCount: domainFullNodeRetryCount.value(),
      fullNodeRetryDelayMs: domainFullNodeDelaysMs.value(),
    },
  }
}
export default config
