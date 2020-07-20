import { config } from 'dotenv'
import { existsSync } from 'fs'
import path from 'path'
import prompts from 'prompts'
import yargs from 'yargs'

export interface CeloEnvArgv extends yargs.Argv {
  celoEnv: string
}

export enum envVar {
  ATTESTATION_BOT_INITIAL_WAIT_SECONDS = 'ATTESTATION_BOT_INITIAL_WAIT_SECONDS',
  ATTESTATION_BOT_IN_BETWEEN_WAIT_SECONDS = 'ATTESTATION_BOT_IN_BETWEEN_WAIT_SECONDS',
  ATTESTATION_BOT_MAX_ATTESTATIONS = 'ATTESTATION_BOT_MAX_ATTESTATIONS',
  ATTESTATION_SERVICE_DOCKER_IMAGE_REPOSITORY = 'ATTESTATION_SERVICE_DOCKER_IMAGE_REPOSITORY',
  ATTESTATION_SERVICE_DOCKER_IMAGE_TAG = 'ATTESTATION_SERVICE_DOCKER_IMAGE_TAG',
  BLOCKSCOUT_DB_SUFFIX = 'BLOCKSCOUT_DB_SUFFIX',
  BLOCKSCOUT_DOCKER_IMAGE_REPOSITORY = 'BLOCKSCOUT_DOCKER_IMAGE_REPOSITORY',
  BLOCKSCOUT_DOCKER_IMAGE_TAG = 'BLOCKSCOUT_DOCKER_IMAGE_TAG',
  BLOCKSCOUT_DROP_DB = 'BLOCKSCOUT_DROP_DB',
  BLOCKSCOUT_METADATA_CRAWLER_IMAGE_REPOSITORY = 'BLOCKSCOUT_METADATA_CRAWLER_IMAGE_REPOSITORY',
  BLOCKSCOUT_METADATA_CRAWLER_IMAGE_TAG = 'BLOCKSCOUT_METADATA_CRAWLER_IMAGE_TAG',
  BLOCKSCOUT_METADATA_CRAWLER_SCHEDULE = 'BLOCKSCOUT_METADATA_CRAWLER_SCHEDULE',
  BLOCKSCOUT_SUBNETWORK_NAME = 'BLOCKSCOUT_SUBNETWORK_NAME',
  BLOCKSCOUT_WEB_REPLICAS = 'BLOCKSCOUT_WEB_REPLICAS',
  BLOCK_TIME = 'BLOCK_TIME',
  CELOCLI_STANDALONE_IMAGE_REPOSITORY = 'CELOCLI_STANDALONE_IMAGE_REPOSITORY',
  CELOCLI_STANDALONE_IMAGE_TAG = 'CELOCLI_STANDALONE_IMAGE_TAG',
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
  CONSENSUS_TYPE = 'CONSENSUS_TYPE',
  CLUSTER_CREATION_FLAGS = 'CLUSTER_CREATION_FLAGS',
  CLUSTER_DOMAIN_NAME = 'CLUSTER_DOMAIN_NAME',
  ENV_TYPE = 'ENV_TYPE',
  EPOCH = 'EPOCH',
  FAUCET_CUSD_WEI = 'FAUCET_CUSD_WEI',
  LOOKBACK = 'LOOKBACK',
  CELOSTATS_SERVER_DOCKER_IMAGE_REPOSITORY = 'CELOSTATS_SERVER_DOCKER_IMAGE_REPOSITORY',
  CELOSTATS_SERVER_DOCKER_IMAGE_TAG = 'CELOSTATS_SERVER_DOCKER_IMAGE_TAG',
  CELOSTATS_FRONTEND_DOCKER_IMAGE_REPOSITORY = 'CELOSTATS_FRONTEND_DOCKER_IMAGE_REPOSITORY',
  CELOSTATS_FRONTEND_DOCKER_IMAGE_TAG = 'CELOSTATS_FRONTEND_DOCKER_IMAGE_TAG',
  CELOSTATS_TRUSTED_ADDRESSES = 'CELOSTATS_TRUSTED_ADDRESSES',
  CELOSTATS_BANNED_ADDRESSES = 'CELOSTATS_BANNED_ADDRESSES',
  CELOSTATS_RESERVED_ADDRESSES = 'CELOSTATS_RESERVED_ADDRESSES',
  EKSPORTISTO_DOCKER_IMAGE_REPOSITORY = 'EKSPORTISTO_DOCKER_IMAGE_REPOSITORY',
  EKSPORTISTO_DOCKER_IMAGE_TAG = 'EKSPORTISTO_DOCKER_IMAGE_TAG',
  EKSPORTISTO_SUFFIX = 'EKSPORTISTO_SUFFIX',
  FAUCET_GENESIS_ACCOUNTS = 'FAUCET_GENESIS_ACCOUNTS',
  FAUCET_GENESIS_BALANCE = 'FAUCET_GENESIS_BALANCE',
  GENESIS_ACCOUNTS = 'GENESIS_ACCOUNTS',
  GETH_ACCOUNT_SECRET = 'GETH_ACCOUNT_SECRET',
  GETH_BOOTNODE_DOCKER_IMAGE_REPOSITORY = 'GETH_BOOTNODE_DOCKER_IMAGE_REPOSITORY',
  GETH_BOOTNODE_DOCKER_IMAGE_TAG = 'GETH_BOOTNODE_DOCKER_IMAGE_TAG',
  GETH_DEBUG = 'GETH_DEBUG',
  GETH_EXPORTER_DOCKER_IMAGE_REPOSITORY = 'GETH_EXPORTER_DOCKER_IMAGE_REPOSITORY',
  GETH_EXPORTER_DOCKER_IMAGE_TAG = 'GETH_EXPORTER_DOCKER_IMAGE_TAG',
  GETH_NODE_DOCKER_IMAGE_REPOSITORY = 'GETH_NODE_DOCKER_IMAGE_REPOSITORY',
  GETH_NODE_DOCKER_IMAGE_TAG = 'GETH_NODE_DOCKER_IMAGE_TAG',
  GETH_NODES_SSD_DISKS = 'GETH_NODES_SSD_DISKS',
  GETH_VERBOSITY = 'GETH_VERBOSITY',
  GETHTX1_NODE_ID = 'GETHTX1_NODE_ID',
  GETHTX2_NODE_ID = 'GETHTX2_NODE_ID',
  GETHTX3_NODE_ID = 'GETHTX3_NODE_ID',
  GETHTX4_NODE_ID = 'GETHTX4_NODE_ID',
  GOOGLE_APPLICATION_CREDENTIALS = 'GOOGLE_APPLICATION_CREDENTIALS',
  ISTANBUL_REQUEST_TIMEOUT_MS = 'ISTANBUL_REQUEST_TIMEOUT_MS',
  IN_MEMORY_DISCOVERY_TABLE = 'IN_MEMORY_DISCOVERY_TABLE',
  KUBERNETES_CLUSTER_NAME = 'KUBERNETES_CLUSTER_NAME',
  KUBERNETES_CLUSTER_ZONE = 'KUBERNETES_CLUSTER_ZONE',
  LEADERBOARD_DOCKER_IMAGE_REPOSITORY = 'LEADERBOARD_DOCKER_IMAGE_REPOSITORY',
  LEADERBOARD_DOCKER_IMAGE_TAG = 'LEADERBOARD_DOCKER_IMAGE_TAG',
  LEADERBOARD_SHEET = 'LEADERBOARD_SHEET',
  LEADERBOARD_CREDENTIALS = 'LEADERBOARD_CREDENTIALS',
  LEADERBOARD_TOKEN = 'LEADERBOARD_TOKEN',
  LOAD_TEST_CLIENTS = 'LOAD_TEST_CLIENTS',
  LOAD_TEST_GENESIS_BALANCE = 'LOAD_TEST_GENESIS_BALANCE',
  LOAD_TEST_TX_DELAY_MS = 'LOAD_TEST_TX_DELAY_MS',
  MNEMONIC = 'MNEMONIC',
  MOBILE_WALLET_PLAYSTORE_LINK = 'MOBILE_WALLET_PLAYSTORE_LINK',
  MOCK_ORACLE_CRON_SCHEDULE = 'MOCK_ORACLE_CRON_SCHEDULE',
  MOCK_ORACLE_DOCKER_IMAGE_REPOSITORY = 'MOCK_ORACLE_DOCKER_IMAGE_REPOSITORY',
  MOCK_ORACLE_DOCKER_IMAGE_TAG = 'MOCK_ORACLE_DOCKER_IMAGE_TAG',
  MOCK_ORACLE_GENESIS_BALANCE = 'MOCK_ORACLE_GENESIS_BALANCE',
  NETWORK_ID = 'NETWORK_ID',
  NEXMO_KEY = 'NEXMO_KEY',
  NEXMO_SECRET = 'NEXMO_SECRET',
  ORACLE_CONTEXTS = 'ORACLE_CONTEXTS',
  ORACLE_DOCKER_IMAGE_REPOSITORY = 'ORACLE_DOCKER_IMAGE_REPOSITORY',
  ORACLE_DOCKER_IMAGE_TAG = 'ORACLE_DOCKER_IMAGE_TAG',
  ORACLE_UNUSED_ORACLE_ADDRESSES = 'ORACLE_UNUSED_ORACLE_ADDRESSES',
  PROMTOSD_EXPORT_INTERVAL = 'PROMTOSD_EXPORT_INTERVAL',
  PROMTOSD_SCRAPE_INTERVAL = 'PROMTOSD_SCRAPE_INTERVAL',
  PRIVATE_TX_NODES = 'PRIVATE_TX_NODES',
  PROXIED_VALIDATORS = 'PROXIED_VALIDATORS',
  STACKDRIVER_MONITORING_DASHBOARD = 'STACKDRIVER_MONITORING_DASHBOARD',
  STACKDRIVER_NOTIFICATION_APPLICATIONS_PREFIX = 'STACKDRIVER_NOTIFICATION_APPLICATIONS_PREFIX',
  STACKDRIVER_NOTIFICATION_CHANNEL_APPLICATIONS = 'STACKDRIVER_NOTIFICATION_CHANNEL_APPLICATIONS',
  STACKDRIVER_NOTIFICATION_CHANNEL_PROTOCOL = 'STACKDRIVER_NOTIFICATION_CHANNEL_PROTOCOL',
  STATIC_IPS_FOR_GETH_NODES = 'STATIC_IPS_FOR_GETH_NODES',
  TESTNET_PROJECT_NAME = 'TESTNET_PROJECT_NAME',
  TIMESTAMP = 'TIMESTAMP',
  TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_REPOSITORY = 'TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_REPOSITORY',
  TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_TAG = 'TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_TAG',
  TRANSACTION_METRICS_EXPORTER_SUFFIX = 'TRANSACTION_METRICS_EXPORTER_SUFFIX',
  TRANSACTION_METRICS_EXPORTER_FROM_BLOCK = 'TRANSACTION_METRICS_EXPORTER_FROM_BLOCK',
  TRANSACTION_METRICS_EXPORTER_TO_BLOCK = 'TRANSACTION_METRICS_EXPORTER_TO_BLOCK',
  TRANSACTION_METRICS_EXPORTER_BLOCK_INTERVAL = 'TRANSACTION_METRICS_EXPORTER_BLOCK_INTERVAL',
  TRANSACTION_METRICS_EXPORTER_WATCH_ADDRESS = 'TRANSACTION_METRICS_EXPORTER_WATCH_ADDRESS',
  TX_NODES = 'TX_NODES',
  TWILIO_ACCOUNT_AUTH_TOKEN = 'TWILIO_ACCOUNT_AUTH_TOKEN',
  TWILIO_ACCOUNT_SID = 'TWILIO_ACCOUNT_SID',
  TWILIO_ADDRESS_SID = 'TWILIO_ADDRESS_SID',
  VALIDATOR_GENESIS_BALANCE = 'VALIDATOR_GENESIS_BALANCE',
  VALIDATOR_ZERO_GENESIS_BALANCE = 'VALIDATOR_ZERO_GENESIS_BALANCE',
  VALIDATORS = 'VALIDATORS',
  VM_BASED = 'VM_BASED',
  VOTING_BOTS = 'VOTING_BOTS',
  VOTING_BOT_BALANCE = 'VOTING_BOT_BALANCE',
  VOTING_BOT_CHANGE_BASELINE = 'VOTING_BOT_CHANGE_BASELINE',
  VOTING_BOT_CRON_SCHEDULE = 'VOTING_BOT_CRON_SCHEDULE',
  VOTING_BOT_EXPLORE_PROBABILITY = 'VOTING_BOT_EXPLORE_PROBABILITY',
  VOTING_BOT_SCORE_SENSITIVITY = 'VOTING_BOT_SCORE_SENSITIVITY',
  VOTING_BOT_WAKE_PROBABILITY = 'VOTING_BOT_WAKE_PROBABILITY',
}

/**
 * Dynamic env vars are env var names that can be dynamically constructed
 * using templates.
 */
export enum DynamicEnvVar {
  ORACLE_AZURE_SUBSCRIPTION_ID = 'ORACLE_{{ oracleContext }}_AZURE_SUBSCRIPTION_ID',
  ORACLE_AZURE_TENANT_ID = 'ORACLE_{{ oracleContext }}_AZURE_TENANT_ID',
  ORACLE_KUBERNETES_CLUSTER_NAME = 'ORACLE_{{ oracleContext }}_KUBERNETES_CLUSTER_NAME',
  ORACLE_AZURE_KUBERNETES_RESOURCE_GROUP = 'ORACLE_{{ oracleContext }}_AZURE_KUBERNETES_RESOURCE_GROUP',
  ORACLE_ADDRESS_AZURE_KEY_VAULTS = 'ORACLE_{{ oracleContext }}_ADDRESS_AZURE_KEY_VAULTS',
  ORACLE_ADDRESSES_FROM_MNEMONIC_COUNT = 'ORACLE_{{ oracleContext }}_ADDRESSES_FROM_MNEMONIC_COUNT',
  ORACLE_TX_NODES_COUNT = 'ORACLE_{{ oracleContext }}_TX_NODES_COUNT',
  ORACLE_TX_NODES_DISK_SIZE = 'ORACLE_{{ oracleContext }}_TX_NODES_DISK_SIZE',
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
