import { switchToClusterFromEnv } from '@celo/celotool/src/lib/cluster'
import { retrieveIPAddress } from '@celo/celotool/src/lib/helm_deploy'
import { exec } from 'child_process'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import path from 'path'
import prompts from 'prompts'
import * as yargs from 'yargs'

export interface CeloEnvArgv extends yargs.Argv {
  celoEnv: string
}

export enum envVar {
  BLOCK_TIME = 'BLOCK_TIME',
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
  GETH_NODES_BACKUP_CRONJOB_ENABLED = 'GETH_NODES_BACKUP_CRONJOB_ENABLED',
  GETH_NODE_DOCKER_IMAGE_REPOSITORY = 'GETH_NODE_DOCKER_IMAGE_REPOSITORY',
  GETH_NODE_DOCKER_IMAGE_TAG = 'GETH_NODE_DOCKER_IMAGE_TAG',
  GETHTX1_NODE_ID = 'GETHTX1_NODE_ID',
  GETHTX2_NODE_ID = 'GETHTX2_NODE_ID',
  GETHTX3_NODE_ID = 'GETHTX3_NODE_ID',
  GETHTX4_NODE_ID = 'GETHTX4_NODE_ID',
  GOOGLE_APPLICATION_CREDENTIALS = 'GOOGLE_APPLICATION_CREDENTIALS',
  KUBERNETES_CLUSTER_NAME = 'KUBERNETES_CLUSTER_NAME',
  KUBERNETES_CLUSTER_ZONE = 'KUBERNETES_CLUSTER_ZONE',
  MNEMONIC = 'MNEMONIC',
  MOBILE_WALLET_PLAYSTORE_LINK = 'MOBILE_WALLET_PLAYSTORE_LINK',
  NETWORK_ID = 'NETWORK_ID',
  NOTIFICATION_SERVICE_FIREBASE_DB = 'NOTIFICATION_SERVICE_FIREBASE_DB',
  PREDEPLOYED_CONTRACTS = 'PREDEPLOYED_CONTRACTS',
  SMS_RETRIEVER_HASH_CODE = 'SMS_RETRIEVER_HASH_CODE',
  STACKDRIVER_MONITORING_DASHBOARD = 'STACKDRIVER_MONITORING_DASHBOARD',
  STACKDRIVER_NOTIFICATION_CHANNEL = 'STACKDRIVER_NOTIFICATION_CHANNEL',
  STATIC_IPS_FOR_GETH_NODES = 'STATIC_IPS_FOR_GETH_NODES',
  TESTNET_PROJECT_NAME = 'TESTNET_PROJECT_NAME',
  TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_REPOSITORY = 'TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_REPOSITORY',
  TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_TAG = 'TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_TAG',
  TX_NODES = 'TX_NODES',
  VALIDATORS = 'VALIDATORS',
}

export enum EnvTypes {
  DEVELOPMENT = 'development',
  INTEGRATION = 'integration',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export function execCmd(cmd: string, options: any = {}): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    if (process.env.CELOTOOL_VERBOSE === 'true') {
      console.debug('$ ' + cmd)
    }

    exec(cmd, { maxBuffer: 1024 * 1000, ...options }, (err, stdout, stderr) => {
      if (process.env.CELOTOOL_VERBOSE === 'true') {
        console.debug(stdout.toString())
      }
      if (err || process.env.CELOTOOL_VERBOSE === 'true') {
        console.error(stderr.toString())
      }
      if (err) {
        reject(err)
      } else {
        resolve([stdout.toString(), stderr.toString()])
      }
    })
  })
}

// Returns a Promise which resolves to [stdout, stderr] array
export function execCmdWithExitOnFailure(
  cmd: string,
  options: any = {}
): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    try {
      resolve(execCmd(cmd, options))
    } catch (error) {
      console.error(error)
      process.exit(1)
      // To make the compiler happy.
      reject(error)
    }
  })
}

export function execBackgroundCmd(cmd: string) {
  if (process.env.CELOTOOL_VERBOSE === 'true') {
    console.debug('$ ' + cmd)
  }
  return exec(cmd, { maxBuffer: 1024 * 1000 }, (err, stdout, stderr) => {
    if (process.env.CELOTOOL_VERBOSE === 'true') {
      console.debug(stdout)
      console.error(stderr)
    }
    if (err) {
      console.error(err)
      process.exit(1)
    }
  })
}

export async function outputIncludes(cmd: string, matchString: string, matchMessage?: string) {
  const [stdout] = await execCmdWithExitOnFailure(cmd)
  if (stdout.includes(matchString)) {
    if (matchMessage) {
      console.info(matchMessage)
    }
    return true
  }
  return false
}

export function getVerificationPoolSMSURL(celoEnv: string) {
  return `https://us-central1-celo-testnet.cloudfunctions.net/handleVerificationRequest${celoEnv}/v0.1/sms/`
}

export function getVerificationPoolRewardsURL(celoEnv: string) {
  return `https://us-central1-celo-testnet.cloudfunctions.net/handleVerificationRequest${celoEnv}/v0.1/rewards/`
}

export async function getVerificationPoolConfig(celoEnv: string) {
  await switchToClusterFromEnv()

  const ip = await retrieveIPAddress(`${celoEnv}-tx-nodes-0`)

  return {
    testnetId: fetchEnv('NETWORK_ID'),
    txIP: ip,
    txPort: '8545',
  }
}

export async function switchToProject(projectName: string) {
  const [currentProject] = await execCmdWithExitOnFailure('gcloud config get-value project')

  if (currentProject !== projectName) {
    await execCmdWithExitOnFailure(`gcloud config set project ${projectName}`)
  }
}

export async function switchToProjectFromEnv() {
  const expectedProject = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  await switchToProject(expectedProject)
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

  const indicatesStagingOrProductionEnv = isStaging(celoEnv) || isProduction(celoEnv)

  if (indicatesStagingOrProductionEnv && !isValidStagingOrProductionEnv(celoEnv)) {
    console.error(
      `${celoEnv} indicated to be a staging or production environment but did not conform to the expected regex ^[a-z][a-z0-9]*(staging|production)$.`
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

export function isStaging(env: string) {
  return env.endsWith(EnvTypes.STAGING)
}

export function isProduction(env: string) {
  return env.endsWith(EnvTypes.PRODUCTION)
}

export function isValidCeloEnv(celoEnv: string) {
  return new RegExp('^[a-z][a-z0-9]*$').test(celoEnv)
}

function isValidStagingOrProductionEnv(celoEnv: string) {
  return new RegExp('^[a-z][a-z0-9]*(staging|production)$').test(celoEnv)
}

function celoEnvMiddleware(argv: CeloEnvArgv) {
  validateAndSwitchToEnv(argv.celoEnv)
}

export async function doCheckOrPromptIfStagingOrProduction() {
  if (
    process.env.CELOTOOL_CONFIRMED !== 'true' &&
    isValidStagingOrProductionEnv(process.env.CELOTOOL_CELOENV!)
  ) {
    const response = await prompts({
      type: 'confirm',
      name: 'confirmation',
      message:
        'You are about to apply a possibly irreversable action on a staging/production environment. Are you sure? (y/n)',
    })

    if (response.confirmation) {
      process.env.CELOTOOL_CONFIRMED = 'true'
    } else {
      console.info('Aborting due to user response')
      process.exit(0)
    }
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

export function addCeloGethMiddleware(argv: yargs.Argv) {
  return argv
    .option('geth-dir', {
      type: 'string',
      description: 'path to geth repository',
      demand: 'Please, specify the path to geth directory, where the binary could be found',
    })
    .option('data-dir', {
      type: 'string',
      description: 'path to datadir',
      demand: 'Please, specify geth datadir',
    })
}

// Some tools require hex address to be preceeded by 0x, some don't.
// Therefore, we try to be conservative and accept only the addresses prefixed by 0x as valid.
export const validateAccountAddress = (address: string) => {
  return address !== null && address.toLowerCase().startsWith('0x') && address.length === 42 // 0x followed by 40 hex-chars
}
