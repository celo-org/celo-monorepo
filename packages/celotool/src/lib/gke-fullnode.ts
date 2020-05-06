import { createNamespaceIfNotExists } from 'src/lib/cluster'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { envVar, fetchEnv } from './env-utils'

const helmChartPath = '../helm-charts/celo-fullnode'

function getKubeNamespace(celoEnv: string) {
  return celoEnv
}

function getReleaseName(celoEnv: string, syncMode: string) {
  return `${celoEnv}-${syncMode}-node`
}

export async function installFullNodeChart(celoEnv: string, syncMode: string) {
  const kubeNamespace = getKubeNamespace(celoEnv)
  const releaseName = getReleaseName(celoEnv, syncMode)
  await createNamespaceIfNotExists(kubeNamespace)

  return installGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(celoEnv, syncMode, kubeNamespace)
  )
}

function helmParameters(celoEnv: string, syncMode: string, kubeNamespace: string) {
  return [
    `--set namespace=${kubeNamespace}`,
    `--set replicaCount=1`,
    `--set storage.size=10Gi`,
    `--set storage.storageClass=standard`,
    `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
    `--set genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set genesis.network=${celoEnv}`,
    `--set geth.use_static_ips=${celoEnv}`,
    `--set geth.syncmode=${syncMode}`,
    `--set geth.gcmode=full`,
  ]
}

export async function removeHelmRelease(celoEnv: string, syncMode: string) {
  await removeGenericHelmChart(getReleaseName(celoEnv, syncMode))
}
