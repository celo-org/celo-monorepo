import { getEnodesAddresses } from 'src/lib/geth'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { envVar, fetchEnv } from 'src/lib/utils'

export async function installHelmChart(
  celoEnv: string,
  loadTestID: string,
  blockscoutProb: number,
  replicas: number,
  mnemonic: string
) {
  const params = await helmParameters(celoEnv, loadTestID, blockscoutProb, replicas, mnemonic)
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

async function helmParameters(
  celoEnv: string,
  loadTestID: string,
  blockscoutProb: number,
  replicas: number,
  mnemonic: string
) {
  const enodes = await getEnodesAddresses(celoEnv)
  const b64EnodesJSON = Buffer.from(JSON.stringify(enodes, null, 0)).toString('base64')
  return [
    `--set imageRepository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set imageTag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set gethImageRepository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set gethImageTag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
    `--set environment=${celoEnv}`,
    `--set enodes="${b64EnodesJSON}"`,
    `--set replicas=${replicas}`,
    `--set mnemonic="${mnemonic}"`,
    `--set networkID=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set loadTestID="${loadTestID}"`,
    `--set geth.verbosity=${fetchEnv('GETH_VERBOSITY')}`,
    `--set blockscoutProb=${blockscoutProb}`,
  ]
}
