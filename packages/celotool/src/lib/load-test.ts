import { getBlockscoutUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { getEnodesWithExternalIPAddresses } from 'src/lib/geth'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'
import { getGenesisBlockFromGoogleStorage } from 'src/lib/testnet-utils'

export async function installHelmChart(
  celoEnv: string,
  blockscoutProb: number,
  delayMs: number,
  replicas: number
) {
  const params = await helmParameters(celoEnv, blockscoutProb, delayMs, replicas)
  return installGenericHelmChart(
    celoEnv,
    celoEnv + '-load-test',
    '../helm-charts/load-test/',
    params
  )
}

export async function upgradeHelmChart(
  celoEnv: string,
  blockscoutProb: number,
  delayMs: number,
  replicas: number
) {
  const params = await helmParameters(celoEnv, blockscoutProb, delayMs, replicas)
  await upgradeGenericHelmChart(
    celoEnv,
    celoEnv + '-load-test',
    '../helm-charts/load-test/',
    params
  )
}

export async function removeHelmRelease(celoEnv: string) {
  return removeGenericHelmChart(celoEnv + '-load-test')
}

async function helmParameters(
  celoEnv: string,
  blockscoutProb: number,
  delayMs: number,
  replicas: number
) {
  const enodes = await getEnodesWithExternalIPAddresses(celoEnv)
  const staticNodesJsonB64 = Buffer.from(JSON.stringify(enodes)).toString('base64')
  // Uses the genesis file from google storage to ensure it's the correct genesis for the network
  const genesisContents = await getGenesisBlockFromGoogleStorage(celoEnv)
  const genesisFileJsonB64 = Buffer.from(genesisContents).toString('base64')
  return [
    `--set geth.accountSecret="${fetchEnv(envVar.GETH_ACCOUNT_SECRET)}"`,
    `--set blockscout.measurePercent=${blockscoutProb}`,
    `--set blockscout.url=${getBlockscoutUrl(celoEnv)}`,
    `--set celotool.image.repository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set celotool.image.tag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set delay=${delayMs}`, // send txs every 5 seconds
    `--set environment=${celoEnv}`,
    `--set geth.genesisFile=${genesisFileJsonB64}`,
    `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
    `--set geth.networkID=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set geth.staticNodes="${staticNodesJsonB64}"`,
    `--set geth.verbosity=${fetchEnv('GETH_VERBOSITY')}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set replicas=${replicas}`,
  ]
}
