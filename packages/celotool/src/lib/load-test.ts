import { getBlockscoutUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { getEnodesWithExternalIPAddresses } from 'src/lib/geth'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  saveHelmValuesFile,
  upgradeGenericHelmChart
} from 'src/lib/helm_deploy'

export async function installHelmChart(
  celoEnv: string,
  blockscoutProb: number,
  delayMs: number,
  replicas: number,
  threads: number
) {
  const params = await helmParameters(celoEnv, blockscoutProb, delayMs, replicas, threads)
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
  replicas: number,
  threads: number
) {
  const params = await helmParameters(celoEnv, blockscoutProb, delayMs, replicas, threads)
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
  replicas: number,
  threads: number
) {
  const enodes = await getEnodesWithExternalIPAddresses(celoEnv)
  const staticNodesJsonB64 = Buffer.from(JSON.stringify(enodes)).toString('base64')
  // Uses the genesis file from google storage to ensure it's the correct genesis for the network
  const valueFilePath = `/tmp/${celoEnv}-testnet-values.yaml`
  await saveHelmValuesFile(celoEnv, valueFilePath, true)

  return [
    `-f ${valueFilePath}`,
    `--set geth.accountSecret="${fetchEnv(envVar.GETH_ACCOUNT_SECRET)}"`,
    `--set blockscout.measurePercent=${blockscoutProb}`,
    `--set blockscout.url=${getBlockscoutUrl(celoEnv)}`,
    `--set celotool.image.repository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set celotool.image.tag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set delay=${delayMs}`, // send txs every 5 seconds
    `--set environment=${celoEnv}`,
    `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
    `--set geth.networkID=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set geth.staticNodes="${staticNodesJsonB64}"`,
    `--set geth.verbosity=${fetchEnv('GETH_VERBOSITY')}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set replicas=${replicas}`,
    `--set threads=${threads}`,
    `--set genesis.useGenesisFileBase64=true`,
  ]
}
