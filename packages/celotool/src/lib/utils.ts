import sleep from 'sleep-promise'
import yargs from 'yargs'
import { switchToClusterFromEnv } from './cluster'
import { execCmdWithExitOnFailure } from './cmd-utils'
import { envVar, fetchEnv, isVmBased } from './env-utils'
import { retrieveIPAddress } from './helm_deploy'
import { getTestnetOutputs } from './vm-testnet-utils'

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

export async function retrieveTxNodeIpAddress(celoEnv: string, txNodeIndex: number) {
  if (isVmBased()) {
    const outputs = await getTestnetOutputs(celoEnv)
    return outputs.tx_node_ip_addresses.value[txNodeIndex]
  } else {
    return retrieveIPAddress(`${celoEnv}-tx-nodes-${txNodeIndex}`)
  }
}

export async function getVerificationPoolConfig(celoEnv: string) {
  await switchToClusterFromEnv()

  const ip = await retrieveTxNodeIpAddress(celoEnv, 0)

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

export async function retryCmd(
  cmd: () => Promise<any>,
  numAttempts: number = 100,
  maxTimeoutMs: number = 15000
) {
  for (let i = 1; i <= numAttempts; i++) {
    try {
      const result = await cmd()
      return result
    } catch (error) {
      const sleepTimeBasisInMs = 1000
      const sleepTimeInMs = Math.min(sleepTimeBasisInMs * Math.pow(2, i), maxTimeoutMs)
      console.warn(
        `${new Date().toLocaleTimeString()} Retry attempt: ${i}/${numAttempts}, ` +
          `retry after sleeping for ${sleepTimeInMs} milli-seconds`,
        error
      )
      await sleep(sleepTimeInMs)
    }
  }
  return null
}
