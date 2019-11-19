import { getBlockscoutUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { generateGenesisFromEnv } from 'src/lib/generate_utils'
import { getEnodesWithExternalIPAddresses } from 'src/lib/geth'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'

export async function installHelmChart(celoEnv: string, blockscoutProb: number, replicas: number) {
  const params = await helmParameters(celoEnv, blockscoutProb, replicas)
  return installGenericHelmChart(
    celoEnv,
    celoEnv + '-load-test',
    '../helm-charts/load-test/',
    params
  )
}

export async function removeHelmRelease(celoEnv: string) {
  return removeGenericHelmChart(celoEnv + '-load-test')
}

async function helmParameters(celoEnv: string, blockscoutProb: number, replicas: number) {
  const enodes = await getEnodesWithExternalIPAddresses(celoEnv)
  const staticNodesJsonB64 = Buffer.from(JSON.stringify(enodes)).toString('base64')
  return [
    `--set blockscout.measurePercent=${blockscoutProb}`,
    `--set blockscout.url=${getBlockscoutUrl(celoEnv)}`,
    `--set celotool.image.repository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set celotool.image.tag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set delay=5000`, // send txs every 5 seconds
    `--set environment=${celoEnv}`,
    `--set geth.genesisFile=${Buffer.from(generateGenesisFromEnv()).toString('base64')}`,
    `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
    `--set geth.networkID=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set geth.staticNodes="${staticNodesJsonB64}"`,
    `--set geth.verbosity=${fetchEnv('GETH_VERBOSITY')}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set replicas=${replicas}`,
  ]
}
