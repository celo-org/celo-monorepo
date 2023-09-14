import { ensureLeading0x } from '@celo/base'
import {
  FULL_NODE_TIMEOUT_IN_MS,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
} from '@celo/phone-number-privacy-common'
import { defineBoolean, defineInt, defineSecret, defineString } from 'firebase-functions/params'

const defaultServiceName = 'odis-combiner'
export const defaultMockDEK = ensureLeading0x(
  'bf8a2b73baf8402f8fe906ad3f42b560bf14b39f7df7797ece9e293d6f162188'
)

// function settings
export const minInstancesConfig = defineInt('MIN_INSTANCES', { default: 0 })
export const requestConcurency = defineInt('REQUEST_CONCURRENCY', { default: 80 })
// Root
export const serviceNameConfig = defineString('SERVICE_NAME', { default: defaultServiceName })

// Blockchain
export const blockchainProvider = defineString('BLOCKCHAIN_PROVIDER')
export const blockchainApiKey = defineSecret('BLOCKCHAIN_API_KEY')

// PNP
export const pnpServiceName = defineString('PNP_SERVICE_NAME', { default: defaultServiceName })
export const pnpEnabled = defineBoolean('PNP_ENABLED', {
  default: false,
  description: '',
})
export const pnpOdisServicesSigners = defineString('PNP_ODIS_SERVICES_SIGNERS')
export const pnpOdisServicesTimeoutMilliseconds = defineInt(
  'PNP_ODIS_SERVICES_TIMEOUT_MILLISECONDS',
  {
    default: 5 * 1000,
  }
)
export const pnpKeysCurrentVersion = defineInt('PNP_KEYS_CURRENT_VERSION')
export const pnpKeysVersions = defineString('PNP_KEYS_VERSIONS')
export const pnpFullNodeTimeoutMs = defineInt('PNP_FULL_NODE_TIMEOUT_MS', {
  default: FULL_NODE_TIMEOUT_IN_MS,
})
export const pnpFullNodeRetryCount = defineInt('PNP_FULL_NODE_RETRY_COUNT', {
  default: RETRY_COUNT,
})
export const pnpFullNodeDelaysMs = defineInt('PNP_FULL_NODE_DELAY_MS', {
  default: RETRY_DELAY_IN_MS,
})
export const pnpShouldAuthenticate = defineBoolean('PNP_SHOULD_AUTHENTICATE', {
  default: true,
})
export const pnpShouldMockAccountService = defineBoolean('PNP_SHOULD_MOCK_ACCOUNT_SERVICE', {
  default: false,
})
export const pnpMockDek = defineString('PNP_MOCK_DECK', { default: defaultMockDEK })

// Domains
export const domainServiceName = defineString('DOMAIN_SERVICE_NAME', {
  default: defaultServiceName,
})
export const domainEnabled = defineBoolean('DOMAIN_ENABLED', { default: false })
export const domainOdisServicesSigners = defineString('DOMAIN_ODIS_SERVICES_SIGNERS')
export const domainOdisServicesTimeoutMilliseconds = defineInt(
  'DOMAIN_ODIS_SERVICES_TIMEOUT_MILLISECONDS',
  {
    default: 5 * 1000,
  }
)
export const domainKeysCurrentVersion = defineInt('DOMAIN_KEYS_CURRENT_VERSION')
export const domainKeysVersions = defineString('DOMAIN_KEYS_VERSIONS')
export const domainFullNodeTimeoutMs = defineInt('DOMAIN_FULL_NODE_TIMEOUT_MS', {
  default: FULL_NODE_TIMEOUT_IN_MS,
})
export const domainFullNodeRetryCount = defineInt('DOMAIN_FULL_NODE_RETRY_COUNT', {
  default: RETRY_COUNT,
})
export const domainFullNodeDelaysMs = defineInt('DOMAIN_FULL_NODE_DELAY_MS', {
  default: RETRY_DELAY_IN_MS,
})
export const domainShouldAuthenticate = defineBoolean('DOMAIN_SHOULD_AUTHENTICATE', {
  default: true,
})
