import { config } from 'dotenv'
import { existsSync } from 'fs'
import path from 'path'
import prompts from 'prompts'
import yargs from 'yargs'

export interface CeloEnvArgv extends yargs.Argv {
  celoEnv: string
}

export enum envVar {
  ATTESTATION_BOT_IN_BETWEEN_WAIT_SECONDS = 'ATTESTATION_BOT_IN_BETWEEN_WAIT_SECONDS',
  ATTESTATION_BOT_INITIAL_WAIT_SECONDS = 'ATTESTATION_BOT_INITIAL_WAIT_SECONDS',
  ATTESTATION_BOT_MAX_ATTESTATIONS = 'ATTESTATION_BOT_MAX_ATTESTATIONS',
  ATTESTATION_BOT_SKIP_ODIS_SALT = 'ATTESTATION_BOT_SKIP_ODIS_SALT',
  ATTESTATION_SERVICE_DOCKER_IMAGE_REPOSITORY = 'ATTESTATION_SERVICE_DOCKER_IMAGE_REPOSITORY',
  ATTESTATION_SERVICE_DOCKER_IMAGE_TAG = 'ATTESTATION_SERVICE_DOCKER_IMAGE_TAG',
  BLOCK_TIME = 'BLOCK_TIME',
  BLOCKSCOUT_DB_SUFFIX = 'BLOCKSCOUT_DB_SUFFIX',
  BLOCKSCOUT_DB_NEW_SUFFIX = 'BLOCKSCOUT_DB_NEW_SUFFIX',
  BLOCKSCOUT_DOCKER_IMAGE_REPOSITORY = 'BLOCKSCOUT_DOCKER_IMAGE_REPOSITORY',
  BLOCKSCOUT_DOCKER_IMAGE_TAG = 'BLOCKSCOUT_DOCKER_IMAGE_TAG',
  BLOCKSCOUT_DROP_DB = 'BLOCKSCOUT_DROP_DB',
  BLOCKSCOUT_METADATA_CRAWLER_IMAGE_REPOSITORY = 'BLOCKSCOUT_METADATA_CRAWLER_IMAGE_REPOSITORY',
  BLOCKSCOUT_METADATA_CRAWLER_IMAGE_TAG = 'BLOCKSCOUT_METADATA_CRAWLER_IMAGE_TAG',
  BLOCKSCOUT_METADATA_CRAWLER_SCHEDULE = 'BLOCKSCOUT_METADATA_CRAWLER_SCHEDULE',
  BLOCKSCOUT_SEGMENT_KEY = 'BLOCKSCOUT_SEGMENT_KEY',
  BLOCKSCOUT_SUBNETWORK_NAME = 'BLOCKSCOUT_SUBNETWORK_NAME',
  BLOCKSCOUT_OVERRIDE_RPC_ENDPOINT = 'BLOCKSCOUT_OVERRIDE_RPC_ENDPOINT',
  BLOCKSCOUT_OVERRIDE_WS_ENDPOINT = 'BLOCKSCOUT_OVERRIDE_WS_ENDPOINT',
  CELO_PROVIDER_BACKUPS = 'CELO_PROVIDER_BACKUPS',
  CELOCLI_STANDALONE_IMAGE_REPOSITORY = 'CELOCLI_STANDALONE_IMAGE_REPOSITORY',
  CELOCLI_STANDALONE_IMAGE_TAG = 'CELOCLI_STANDALONE_IMAGE_TAG',
  CELOSTATS_BANNED_ADDRESSES = 'CELOSTATS_BANNED_ADDRESSES',
  CELOSTATS_FRONTEND_DOCKER_IMAGE_REPOSITORY = 'CELOSTATS_FRONTEND_DOCKER_IMAGE_REPOSITORY',
  CELOSTATS_FRONTEND_DOCKER_IMAGE_TAG = 'CELOSTATS_FRONTEND_DOCKER_IMAGE_TAG',
  CELOSTATS_RESERVED_ADDRESSES = 'CELOSTATS_RESERVED_ADDRESSES',
  CELOSTATS_SERVER_DOCKER_IMAGE_REPOSITORY = 'CELOSTATS_SERVER_DOCKER_IMAGE_REPOSITORY',
  CELOSTATS_SERVER_DOCKER_IMAGE_TAG = 'CELOSTATS_SERVER_DOCKER_IMAGE_TAG',
  CELOSTATS_TRUSTED_ADDRESSES = 'CELOSTATS_TRUSTED_ADDRESSES',
  CELOTOOL_CELOENV = 'CELOTOOL_CELOENV',
  CELOTOOL_CONFIRMED = 'CELOTOOL_CONFIRMED',
  CELOTOOL_DOCKER_IMAGE_REPOSITORY = 'CELOTOOL_DOCKER_IMAGE_REPOSITORY',
  CELOTOOL_DOCKER_IMAGE_TAG = 'CELOTOOL_DOCKER_IMAGE_TAG',
  CHAOS_TEST_DURATION = 'CHAOS_TEST_DURATION',
  CHAOS_TEST_INTERVAL = 'CHAOS_TEST_INTERVAL',
  CHAOS_TEST_KILL_INTERVAL = 'CHAOS_TEST_KILL_INTERVAL',
  CHAOS_TEST_NETWORK_DELAY = 'CHAOS_TEST_NETWORK_DELAY',
  CHAOS_TEST_NETWORK_JITTER = 'CHAOS_TEST_NETWORK_JITTER',
  CHAOS_TEST_NETWORK_LOSS = 'CHAOS_TEST_NETWORK_LOSS',
  CHAOS_TEST_NETWORK_RATE = 'CHAOS_TEST_NETWORK_RATE',
  CHURRITO_BLOCK = 'CHURRITO_BLOCK',
  CLUSTER_CREATION_FLAGS = 'CLUSTER_CREATION_FLAGS',
  CLUSTER_DOMAIN_NAME = 'CLUSTER_DOMAIN_NAME',
  CONSENSUS_TYPE = 'CONSENSUS_TYPE',
  CONTEXTS = 'CONTEXTS',
  DONUT_BLOCK = 'DONUT_BLOCK',
  E2E_TESTS_FORCE_USE_MYCELO = 'E2E_TESTS_FORCE_USE_MYCELO',
  EKSPORTISTO_DOCKER_IMAGE_REPOSITORY = 'EKSPORTISTO_DOCKER_IMAGE_REPOSITORY',
  EKSPORTISTO_DOCKER_IMAGE_TAG = 'EKSPORTISTO_DOCKER_IMAGE_TAG',
  EKSPORTISTO_SUFFIX = 'EKSPORTISTO_SUFFIX',
  EKSPORTISTO_CHART_VERSION = 'EKSPORTISTO_CHART_VERSION',
  ENV_TYPE = 'ENV_TYPE',
  EPOCH = 'EPOCH',
  ESPRESSO_BLOCK = 'ESPRESSO_BLOCK',
  FAUCET_CUSD_WEI = 'FAUCET_CUSD_WEI',
  FAUCET_GENESIS_ACCOUNTS = 'FAUCET_GENESIS_ACCOUNTS',
  FAUCET_GENESIS_BALANCE = 'FAUCET_GENESIS_BALANCE',
  FORNO_BANNED_CIDR = 'FORNO_BANNED_CIDR',
  FORNO_DOMAINS = 'FORNO_DOMAINS',
  FORNO_FULL_NODE_CONTEXTS = 'FORNO_FULL_NODE_CONTEXTS',
  FORNO_VPC_NETWORK_NAME = 'FORNO_VPC_NETWORK_NAME',
  FULL_NODE_READINESS_CHECK_BLOCK_AGE = 'FULL_NODE_READINESS_CHECK_BLOCK_AGE',
  GENESIS_ACCOUNTS = 'GENESIS_ACCOUNTS',
  GETH_ACCOUNT_SECRET = 'GETH_ACCOUNT_SECRET',
  GETH_BOOTNODE_DOCKER_IMAGE_REPOSITORY = 'GETH_BOOTNODE_DOCKER_IMAGE_REPOSITORY',
  GETH_BOOTNODE_DOCKER_IMAGE_TAG = 'GETH_BOOTNODE_DOCKER_IMAGE_TAG',
  GETH_BOOTNODE_OVERWRITE_PKEY = 'GETH_BOOTNODE_OVERWRITE_PKEY',
  GETH_DEBUG = 'GETH_DEBUG',
  GETH_ENABLE_METRICS = 'GETH_ENABLE_METRICS',
  GETH_NODE_DOCKER_IMAGE_REPOSITORY = 'GETH_NODE_DOCKER_IMAGE_REPOSITORY',
  GETH_NODE_DOCKER_IMAGE_TAG = 'GETH_NODE_DOCKER_IMAGE_TAG',
  GETH_NODES_SSD_DISKS = 'GETH_NODES_SSD_DISKS',
  GETH_USE_MYCELO = 'GETH_USE_MYCELO',
  GETH_MYCELO_COMMIT = 'GETH_MYCELO_COMMIT',
  GETH_VERBOSITY = 'GETH_VERBOSITY',
  GOOGLE_APPLICATION_CREDENTIALS = 'GOOGLE_APPLICATION_CREDENTIALS',
  GRAFANA_CLOUD_PROJECT_ID = 'GRAFANA_CLOUD_PROJECT_ID',
  GRAFANA_CLOUD_SECRET_NAME = 'GRAFANA_CLOUD_SECRET_NAME',
  GRAFANA_CLOUD_SECRET_VERSION = 'GRAFANA_CLOUD_SECRET_VERSION',
  GRAFANA_LOCAL_ADMIN_PASSWORD = 'GRAFANA_LOCAL_ADMIN_PASSWORD',
  GRAFANA_LOCAL_OAUTH2_CLIENT_ID = 'GRAFANA_LOCAL_OAUTH2_CLIENT_ID',
  GRAFANA_LOCAL_OAUTH2_CLIENT_SECRET = 'GRAFANA_LOCAL_OAUTH2_CLIENT_SECRET',
  IN_MEMORY_DISCOVERY_TABLE = 'IN_MEMORY_DISCOVERY_TABLE',
  ISTANBUL_REQUEST_TIMEOUT_MS = 'ISTANBUL_REQUEST_TIMEOUT_MS',
  KOMENCI_DOCKER_IMAGE_REPOSITORY = 'KOMENCI_DOCKER_IMAGE_REPOSITORY',
  KOMENCI_DOCKER_IMAGE_TAG = 'KOMENCI_DOCKER_IMAGE_TAG',
  KOMENCI_RULE_CONFIG_CAPTCHA_BYPASS_TOKEN = 'KOMENCI_RULE_CONFIG_CAPTCHA_BYPASS_TOKEN',
  KOMENCI_SHOULD_SEND_REWARDS = 'KOMENCI_SHOULD_SEND_REWARDS',
  KOMENCI_UNUSED_KOMENCI_ADDRESSES = 'KOMENCI_UNUSED_KOMENCI_ADDRESSES',
  KUBECONFIG = 'KUBECONFIG',
  KUBERNETES_CLUSTER_NAME = 'KUBERNETES_CLUSTER_NAME',
  KUBERNETES_CLUSTER_ZONE = 'KUBERNETES_CLUSTER_ZONE',
  LEADERBOARD_CREDENTIALS = 'LEADERBOARD_CREDENTIALS',
  LEADERBOARD_DOCKER_IMAGE_REPOSITORY = 'LEADERBOARD_DOCKER_IMAGE_REPOSITORY',
  LEADERBOARD_DOCKER_IMAGE_TAG = 'LEADERBOARD_DOCKER_IMAGE_TAG',
  LEADERBOARD_SHEET = 'LEADERBOARD_SHEET',
  LEADERBOARD_TOKEN = 'LEADERBOARD_TOKEN',
  LOAD_TEST_CLIENTS = 'LOAD_TEST_CLIENTS',
  LOAD_TEST_THREADS = 'LOAD_TEST_THREADS',
  LOAD_TEST_GENESIS_BALANCE = 'LOAD_TEST_GENESIS_BALANCE',
  LOAD_TEST_TX_DELAY_MS = 'LOAD_TEST_TX_DELAY_MS',
  LOAD_TEST_USE_RANDOM_RECIPIENT = 'LOAD_TEST_USE_RANDOM_RECIPIENT',
  LOKI_URL = 'LOKI_URL',
  LOKI_KEY = 'LOKI_KEY',
  LOKI_USERNAME = 'LOKI_USERNAME',
  LOOKBACK = 'LOOKBACK',
  METADATA_CRAWLER_DISCORD_CLUSTER_NAME = 'METADATA_CRAWLER_DISCORD_CLUSTER_NAME',
  METADATA_CRAWLER_DISCORD_WEBHOOK = 'METADATA_CRAWLER_DISCORD_WEBHOOK',
  MNEMONIC = 'MNEMONIC',
  MOBILE_WALLET_PLAYSTORE_LINK = 'MOBILE_WALLET_PLAYSTORE_LINK',
  MOCK_ORACLE_CRON_SCHEDULE = 'MOCK_ORACLE_CRON_SCHEDULE',
  MOCK_ORACLE_DOCKER_IMAGE_REPOSITORY = 'MOCK_ORACLE_DOCKER_IMAGE_REPOSITORY',
  MOCK_ORACLE_DOCKER_IMAGE_TAG = 'MOCK_ORACLE_DOCKER_IMAGE_TAG',
  MOCK_ORACLE_GENESIS_BALANCE = 'MOCK_ORACLE_GENESIS_BALANCE',
  NETWORK_ID = 'NETWORK_ID',
  NEXMO_APPLICATIONS = 'NEXMO_APPLICATIONS',
  NEXMO_KEY = 'NEXMO_KEY',
  NEXMO_SECRET = 'NEXMO_SECRET',
  NODE_DISK_SIZE_GB = 'NODE_DISK_SIZE_GB',
  ODIS_SIGNER_DOCKER_IMAGE_REPOSITORY = 'ODIS_SIGNER_DOCKER_IMAGE_REPOSITORY',
  ODIS_SIGNER_DOCKER_IMAGE_TAG = 'ODIS_SIGNER_DOCKER_IMAGE_TAG',
  ODIS_SIGNER_BLOCKCHAIN_PROVIDER = 'ODIS_SIGNER_BLOCKCHAIN_PROVIDER',
  ORACLE_DOCKER_IMAGE_REPOSITORY = 'ORACLE_DOCKER_IMAGE_REPOSITORY',
  ORACLE_DOCKER_IMAGE_TAG = 'ORACLE_DOCKER_IMAGE_TAG',
  ORACLE_UNUSED_ORACLE_ADDRESSES = 'ORACLE_UNUSED_ORACLE_ADDRESSES',
  PRIVATE_NODE_DISK_SIZE_GB = 'PRIVATE_NODE_DISK_SIZE_GB',
  PRIVATE_TX_NODES = 'PRIVATE_TX_NODES',
  PROMETHEUS_DISABLE_STACKDRIVER_SIDECAR = 'PROMETHEUS_DISABLE_STACKDRIVER_SIDECAR',
  PROMETHEUS_REMOTE_WRITE_PASSWORD = 'PROMETHEUS_REMOTE_WRITE_PASSWORD',
  PROMETHEUS_REMOTE_WRITE_URL = 'PROMETHEUS_REMOTE_WRITE_URL',
  PROMETHEUS_REMOTE_WRITE_USERNAME = 'PROMETHEUS_REMOTE_WRITE_USERNAME',
  PROXIED_VALIDATORS = 'PROXIED_VALIDATORS',
  SMS_PROVIDERS = 'SMS_PROVIDERS',
  SMS_PROVIDERS_RANDOMIZED = 'SMS_PROVIDERS_RANDOMIZED',
  PROXY_ROLLING_UPDATE_PARTITION = 'PROXY_ROLLING_UPDATE_PARTITION',
  SECONDARIES_ROLLING_UPDATE_PARTITION = 'SECONDARIES_ROLLING_UPDATE_PARTITION',
  STATIC_IPS_FOR_GETH_NODES = 'STATIC_IPS_FOR_GETH_NODES',
  TELEKOM_FROM = 'TELEKOM_FROM',
  TELEKOM_API_KEY = 'TELEKOM_API_KEY',
  TESTNET_PROJECT_NAME = 'TESTNET_PROJECT_NAME',
  TIMESTAMP = 'TIMESTAMP',
  TRANSACTION_METRICS_EXPORTER_BLOCK_INTERVAL = 'TRANSACTION_METRICS_EXPORTER_BLOCK_INTERVAL',
  TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_REPOSITORY = 'TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_REPOSITORY',
  TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_TAG = 'TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_TAG',
  TRANSACTION_METRICS_EXPORTER_FROM_BLOCK = 'TRANSACTION_METRICS_EXPORTER_FROM_BLOCK',
  TRANSACTION_METRICS_EXPORTER_SUFFIX = 'TRANSACTION_METRICS_EXPORTER_SUFFIX',
  TRANSACTION_METRICS_EXPORTER_TO_BLOCK = 'TRANSACTION_METRICS_EXPORTER_TO_BLOCK',
  TRANSACTION_METRICS_EXPORTER_WATCH_ADDRESS = 'TRANSACTION_METRICS_EXPORTER_WATCH_ADDRESS',
  TWILIO_ACCOUNT_AUTH_TOKEN = 'TWILIO_ACCOUNT_AUTH_TOKEN',
  TWILIO_ACCOUNT_SID = 'TWILIO_ACCOUNT_SID',
  TWILIO_ADDRESS_SID = 'TWILIO_ADDRESS_SID',
  TWILIO_VERIFY_SERVICE_SID = `TWILIO_VERIFY_SERVICE_SID`,
  TX_NODES = 'TX_NODES',
  TX_NODES_PRIVATE_ROLLING_UPDATE_PARTITION = 'TX_NODES_PRIVATE_ROLLING_UPDATE_PARTITION',
  TX_NODES_ROLLING_UPDATE_PARTITION = 'TX_NODES_ROLLING_UPDATE_PARTITION',
  USE_GSTORAGE_DATA = 'USE_GSTORAGE_DATA',
  VALIDATOR_GENESIS_BALANCE = 'VALIDATOR_GENESIS_BALANCE',
  VALIDATOR_PROXY_COUNTS = 'VALIDATOR_PROXY_COUNTS',
  VALIDATOR_ZERO_GENESIS_BALANCE = 'VALIDATOR_ZERO_GENESIS_BALANCE',
  VALIDATORS = 'VALIDATORS',
  VALIDATORS_ROLLING_UPDATE_PARTITION = 'VALIDATORS_ROLLING_UPDATE_PARTITION',
  VM_BASED = 'VM_BASED',
  VOTING_BOT_BALANCE = 'VOTING_BOT_BALANCE',
  VOTING_BOT_CHANGE_BASELINE = 'VOTING_BOT_CHANGE_BASELINE',
  VOTING_BOT_CRON_SCHEDULE = 'VOTING_BOT_CRON_SCHEDULE',
  VOTING_BOT_EXPLORE_PROBABILITY = 'VOTING_BOT_EXPLORE_PROBABILITY',
  VOTING_BOT_SCORE_SENSITIVITY = 'VOTING_BOT_SCORE_SENSITIVITY',
  VOTING_BOT_WAKE_PROBABILITY = 'VOTING_BOT_WAKE_PROBABILITY',
  VOTING_BOTS = 'VOTING_BOTS',
  WALLET_CONNECT_IMAGE_REPOSITORY = 'WALLET_CONNECT_IMAGE_REPOSITORY',
  WALLET_CONNECT_IMAGE_TAG = 'WALLET_CONNECT_IMAGE_TAG',
  WALLET_CONNECT_REDIS_CLUSTER_ENABLED = 'WALLET_CONNECT_REDIS_CLUSTER_ENABLED',
  WALLET_CONNECT_REDIS_CLUSTER_USEPASSWORD = 'WALLET_CONNECT_REDIS_CLUSTER_USEPASSWORD',
}

/**
 * Dynamic env vars are env var names that can be dynamically constructed
 * using templates.
 */
export enum DynamicEnvVar {
  AWS_CLUSTER_REGION = '{{ context }}_AWS_KUBERNETES_CLUSTER_REGION',
  AWS_RESOURCE_GROUP_TAG = '{{ context }}_AWS_KUBERNETES_RESOURCE_GROUP',
  AZURE_SUBSCRIPTION_ID = '{{ context }}_AZURE_SUBSCRIPTION_ID',
  AZURE_KUBERNETES_RESOURCE_GROUP = '{{ context }}_AZURE_KUBERNETES_RESOURCE_GROUP',
  AZURE_REGION_NAME = '{{ context }}_AZURE_REGION_NAME',
  AZURE_TENANT_ID = '{{ context }}_AZURE_TENANT_ID',
  FULL_NODES_COUNT = '{{ context }}_FULL_NODES_COUNT',
  FULL_NODES_DISK_SIZE = '{{ context }}_FULL_NODES_DISK_SIZE',
  FULL_NODES_GETH_GC_MODE = '{{ context }}_FULL_NODES_GETH_GC_MODE',
  FULL_NODES_NODEKEY_DERIVATION_STRING = '{{ context }}_FULL_NODES_NODEKEY_DERIVATION_STRING',
  FULL_NODES_ROLLING_UPDATE_PARTITION = '{{ context }}_FULL_NODES_ROLLING_UPDATE_PARTITION',
  FULL_NODES_RPC_API_METHODS = '{{ context }}_FULL_NODES_RPC_API_METHODS',
  FULL_NODES_STATIC_NODES_FILE_SUFFIX = '{{ context }}_FULL_NODES_STATIC_NODES_FILE_SUFFIX',
  FULL_NODES_USE_GSTORAGE_DATA = '{{ context }}_FULL_NODES_USE_GSTORAGE_DATA',
  FULL_NODES_WS_PORT = '{{ context }}_FULL_NODES_WS_PORT',
  GCP_PROJECT_NAME = '{{ context }}_GCP_PROJECT_NAME',
  GCP_ZONE = '{{ context }}_GCP_ZONE',
  KUBERNETES_CLUSTER_NAME = '{{ context }}_KUBERNETES_CLUSTER_NAME',
  KOMENCI_ADDRESS_AZURE_KEY_VAULTS = '{{ context }}_KOMENCI_ADDRESS_AZURE_KEY_VAULTS',
  KOMENCI_ADDRESSES_FROM_MNEMONIC_COUNT = '{{ context }}_KOMENCI_ADDRESSES_FROM_MNEMONIC_COUNT',
  KOMENCI_CELOLABS_REWARDS_ADDRESS_AZURE_KEY_VAULTS = '{{ context }}_KOMENCI_CELOLABS_REWARDS_ADDRESS_AZURE_KEY_VAULTS',
  KOMENCI_FOUNDATION_REWARDS_ADDRESS_AZURE_KEY_VAULTS = '{{ context }}_KOMENCI_FOUNDATION_REWARDS_ADDRESS_AZURE_KEY_VAULTS',
  KOMENCI_REWARD_SERVICE_INSTANCE_COUNT = '{{ context }}_KOMENCI_REWARD_SERVICE_INSTANCE_COUNT',
  KOMENCI_DB_HOST = '{{ context }}_KOMENCI_DB_HOST',
  KOMENCI_DB_PORT = '{{ context }}_KOMENCI_DB_PORT',
  KOMENCI_DB_USERNAME = '{{ context }}_KOMENCI_DB_USERNAME',
  KOMENCI_DB_PASSWORD_VAULT_NAME = '{{ context }}_KOMENCI_DB_PASSWORD_VAULT_NAME',
  KOMENCI_REWARD_SERVICE_DB_HOST = '{{ context }}_KOMENCI_REWARD_SERVICE_DB_HOST',
  KOMENCI_REWARD_SERVICE_DB_PORT = '{{ context }}_KOMENCI_REWARD_SERVICE_DB_PORT',
  KOMENCI_REWARD_SERVICE_DB_USERNAME = '{{ context }}_KOMENCI_REWARD_SERVICE_DB_USERNAME',
  KOMENCI_REWARD_SERVICE_DB_PASSWORD_VAULT_NAME = '{{ context }}_KOMENCI_REWARD_SERVICE_DB_PASSWORD_VAULT_NAME',
  KOMENCI_NETWORK = '{{ context }}_KOMENCI_NETWORK',
  KOMENCI_APP_SECRETS_VAULT_NAME = '{{ context }}_KOMENCI_APP_SECRETS_VAULT_NAME',
  KOMENCI_RULE_CONFIG_CAPTCHA_BYPASS_ENABLED = '{{ context }}_KOMENCI_RULE_CONFIG_CAPTCHA_BYPASS_ENABLED',
  ORACLE_ADDRESS_AWS_KEY_ALIASES = '{{ context }}_{{ currencyPair }}_ORACLE_ADDRESS_AWS_KEY_ALIASES',
  ORACLE_ADDRESS_AZURE_KEY_VAULTS = '{{ context }}_{{ currencyPair }}_ORACLE_ADDRESS_AZURE_KEY_VAULTS',
  ORACLE_ADDRESSES_FROM_MNEMONIC_COUNT = '{{ context }}_{{ currencyPair}}_ORACLE_ADDRESSES_FROM_MNEMONIC_COUNT',
  ODIS_SIGNER_BLOCKCHAIN_API_KEY = '{{ context }}_ODIS_SIGNER_BLOCKCHAIN_API_KEY',
  ODIS_SIGNER_AZURE_KEYVAULT_NAME = '{{ context }}_ODIS_SIGNER_AZURE_KEYVAULT_NAME',
  ODIS_SIGNER_AZURE_KEYVAULT_SECRET_NAME = '{{ context }}_ODIS_SIGNER_AZURE_KEYVAULT_SECRET_NAME',
  ODIS_SIGNER_DB_HOST = '{{ context }}_ODIS_SIGNER_DB_HOST',
  ODIS_SIGNER_DB_PORT = '{{ context }}_ODIS_SIGNER_DB_PORT',
  ODIS_SIGNER_DB_USERNAME = '{{ context }}_ODIS_SIGNER_DB_USERNAME',
  ODIS_SIGNER_DB_PASSWORD = '{{ context }}_ODIS_SIGNER_DB_PASSWORD',
  ODIS_SIGNER_LOG_LEVEL = 'ODIS_SIGNER_LOG_LEVEL',
  ODIS_SIGNER_LOG_FORMAT = 'ODIS_SIGNER_LOG_FORMAT',
  ODIS_NETWORK = '{{ context }}_ODIS_NETWORK',
  PROM_SIDECAR_DISABLED = '{{ context }}_PROM_SIDECAR_DISABLED',
  PROM_SIDECAR_GCP_PROJECT = '{{ context }}_PROM_SIDECAR_GCP_PROJECT',
  PROM_SIDECAR_GCP_REGION = '{{ context }}_PROM_SIDECAR_GCP_REGION',
  PROM_SCRAPE_JOB_NAME = '{{ context }}_PROM_SCRAPE_JOB_NAME',
  PROM_SCRAPE_LABELS = '{{ context }}_PROM_SCRAPE_LABELS',
  PROM_SCRAPE_TARGETS = '{{ context }}_PROM_SCRAPE_TARGETS',
  PROM_REMOTE_WRITE_PASSWORD = '{{ context }}_PROM_REMOTE_WRITE_PASSWORD',
  PROM_REMOTE_WRITE_USERNAME = '{{ context }}_PROM_REMOTE_WRITE_USERNAME',
  PROM_REMOTE_WRITE_URL = '{{ context }}_PROM_REMOTE_WRITE_URL',
}

export enum EnvTypes {
  DEVELOPMENT = 'development',
  INTEGRATION = 'integration',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export function fetchEnv(env: string, customErrorMessage?: string): string {
  if (process.env[env] === undefined) {
    console.error(
      customErrorMessage !== undefined ? customErrorMessage : `Requires variable ${env} to be set`
    )
    process.exit(1)
  }
  return process.env[env]!
}

export const monorepoRoot = path.resolve(process.cwd(), './../..')
export const genericEnvFilePath = path.resolve(monorepoRoot, '.env')

export function getEnvFile(celoEnv: string, envBegining: string = '') {
  const filePath: string = path.resolve(monorepoRoot, `.env${envBegining}.${celoEnv}`)
  if (existsSync(filePath)) {
    return filePath
  } else {
    return `${genericEnvFilePath}${envBegining}`
  }
}

export function fetchEnvOrFallback(env: string, fallback: string) {
  return process.env[env] || fallback
}

export function validateAndSwitchToEnv(celoEnv: string) {
  if (!isValidCeloEnv(celoEnv)) {
    console.error(
      `${celoEnv} does not conform to specification ^[a-z][a-z0-9]*$. We need to it to conform to that regex because it is used as URL components, Kubernetes namespace names, keys in configuration objects, etc.`
    )
    process.exit(1)
  }

  const envResult = config({ path: getEnvFile(celoEnv) })
  const envMemonicResult = config({ path: getEnvFile(celoEnv, '.mnemonic') })

  const convinedParsedResults: { [s: string]: string } = {}

  for (const result of [envResult, envMemonicResult]) {
    if (result.error) {
      throw result.error
    }
    Object.assign(convinedParsedResults, result.parsed)
  }

  // Override any env variables that weren't set by config.
  if (convinedParsedResults) {
    for (const k of Object.keys(convinedParsedResults)) {
      process.env[k] = convinedParsedResults[k]
    }
  }

  process.env.CELOTOOL_CELOENV = celoEnv
}

export function isProduction() {
  return fetchEnv(envVar.ENV_TYPE).toLowerCase() === EnvTypes.PRODUCTION
}

export function isValidCeloEnv(celoEnv: string) {
  return new RegExp('^[a-z][a-z0-9]*$').test(celoEnv)
}

export function getDynamicEnvVarValue(
  dynamicEnvVar: DynamicEnvVar,
  templateValues: any,
  defaultValue?: string
) {
  const envVarName = getDynamicEnvVarName(dynamicEnvVar, templateValues)
  return defaultValue !== undefined
    ? fetchEnvOrFallback(envVarName, defaultValue)
    : fetchEnv(envVarName)
}

/**
 * Replaces a dynamic env var's template strings with values from an object.
 * For each template value that was given, it replaces the corresponding template
 * string.
 * For example, if the DynamicEnvVar is:
 *   '{{ thing }}-is-{{noun}}!!!'
 * and templateValues is the object:
 *   { thing: 'celo', noun: 'cool' }
 * then we can expect this function to return the string:
 *   'celo-is-cool!!!'
 * Returns the name of the env var.
 */
export function getDynamicEnvVarName(dynamicEnvVar: DynamicEnvVar, templateValues: any) {
  return Object.keys(templateValues).reduce((agg: string, templateKey: string) => {
    return agg.replace(new RegExp(`{{ *${templateKey} *}}`, 'g'), templateValues[templateKey])
  }, dynamicEnvVar)
}

function celoEnvMiddleware(argv: CeloEnvArgv) {
  validateAndSwitchToEnv(argv.celoEnv)
}

export async function doCheckOrPromptIfStagingOrProduction() {
  if (process.env.CELOTOOL_CONFIRMED !== 'true' && isProduction()) {
    await confirmAction(
      `You are about to apply a possibly irreversible action on a production env: ${process.env.CELOTOOL_CELOENV}. Are you sure?`
    )
    process.env.CELOTOOL_CONFIRMED = 'true'
  }
}

export async function confirmAction(
  message: string,
  onConfirmFailed?: () => Promise<void>,
  onConfirmSuccess?: () => Promise<void>
) {
  const response = await prompts({
    type: 'confirm',
    name: 'confirmation',
    message: `${message} (y/n)`,
  })
  if (!response.confirmation) {
    console.info('Aborting due to user response')
    if (onConfirmFailed) {
      await onConfirmFailed()
    }
    process.exit(0)
  }
  if (onConfirmSuccess) {
    await onConfirmSuccess()
  }
}

export function addCeloEnvMiddleware(argv: yargs.Argv) {
  return (
    argv
      .option('celo-env', {
        demand: 'Please specify a valid CELO_ENV',
        alias: 'e',
        required: true,
        description: 'the environment in which you want to execute this command',
      })
      // @ts-ignore Since we pass it right above, we know that celoEnv will be there at runtime
      .middleware([celoEnvMiddleware])
  )
}

export function isVmBased() {
  return fetchEnv(envVar.VM_BASED) === 'true'
}

export function failIfNotVmBased() {
  if (!isVmBased()) {
    console.error('The celo env is not intended for a VM-based testnet, aborting')
    process.exit(1)
  }
}

export function failIfVmBased() {
  if (isVmBased()) {
    console.error('The celo env is intended for a VM-based testnet, aborting')
    process.exit(1)
  }
}
