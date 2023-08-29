import {
  DB_POOL_MAX_SIZE,
  DB_TIMEOUT,
  FULL_NODE_TIMEOUT_IN_MS,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
} from '@celo/phone-number-privacy-common'
import { defineBoolean, defineInt, defineSecret, defineString } from 'firebase-functions/params'
import { SupportedDatabase } from '../config'

const defaultServiceName = 'odis-combiner'

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

// DB
export const dbType = defineString('DB_TYPE', { default: SupportedDatabase.Postgres.toString() })
export const dbUsername = defineString('DB_USERNAME')
export const dbPassword = defineSecret('DB_PASSWORD')
export const dbName = defineString('DB_NAME')
export const dbHost = defineString('DB_HOST')
export const dbPort = defineInt('DB_PORT', { default: undefined })
export const dbSsl = defineBoolean('DB_SSL', { default: true })
export const dbPoolMaxSize = defineInt('DB_POOL_MAX_SIZE', { default: DB_POOL_MAX_SIZE })
export const dbTimeout = defineInt('DB_TIMEOUT', { default: DB_TIMEOUT })
