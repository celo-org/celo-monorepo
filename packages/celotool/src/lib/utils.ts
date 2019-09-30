import { exec } from 'child_process'
// import prompts from 'prompts'
import yargs from 'yargs'
import { switchToClusterFromEnv } from './cluster'
import { envVar, fetchEnv } from './env-utils'
import { retrieveIPAddress } from './helm_deploy'

// Returns a Promise which resolves to [stdout, stderr] array
export function execCmd(
  cmd: string,
  execOptions: any = {},
  rejectWithOutput = false,
  pipeOutput = false
): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    if (process.env.CELOTOOL_VERBOSE === 'true') {
      console.debug('$ ' + cmd)
      pipeOutput = true
    }

    const execProcess = exec(
      cmd,
      { maxBuffer: 1024 * 1000, ...execOptions },
      (err, stdout, stderr) => {
        if (process.env.CELOTOOL_VERBOSE === 'true') {
          console.debug(stdout.toString())
        }
        if (err || process.env.CELOTOOL_VERBOSE === 'true') {
          console.error(stderr.toString())
        }
        if (err) {
          if (rejectWithOutput) {
            reject([err, stdout.toString(), stderr.toString()])
          } else {
            reject(err)
          }
        } else {
          resolve([stdout.toString(), stderr.toString()])
        }
      }
    )

    if (pipeOutput) {
      execProcess.stdout.pipe(process.stdout)
      execProcess.stderr.pipe(process.stderr)
    }
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

export const ensure0x = (hexstr: string) => (hexstr.startsWith('0x') ? hexstr : '0x' + hexstr)
export const strip0x = (hexstr: string) => (hexstr.startsWith('0x') ? hexstr.slice(2) : hexstr)
