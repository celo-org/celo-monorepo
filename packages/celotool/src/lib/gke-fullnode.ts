import { createNamespaceIfNotExists } from 'src/lib/cluster'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { envVar, fetchEnv } from './env-utils'
import { deletePersistentVolumeClaimsCustomLabels, upgradeGenericHelmChart } from './helm_deploy'
import { scaleResource } from './kubernetes'

const helmChartPath = '../helm-charts/celo-fullnode'

function getKubeNamespace(celoEnv: string, namespace: string) {
  if (namespace && namespace.length > 0) {
    return namespace
  }
  return celoEnv
}

function getReleaseName(celoEnv: string, syncmode: string, namespace: string) {
  return `${celoEnv}-${namespace}-${syncmode}-node`
}

export async function installFullNodeChart(celoEnv: string, syncmode: string, namespace: string) {
  const kubeNamespace = getKubeNamespace(celoEnv, namespace)
  const releaseName = getReleaseName(celoEnv, syncmode, kubeNamespace)
  await createNamespaceIfNotExists(kubeNamespace)

  return installGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(celoEnv, syncmode, kubeNamespace)
  )
}

function helmParameters(celoEnv: string, syncmode: string, kubeNamespace: string) {
  return [
    `--set namespace=${kubeNamespace}`,
    `--set replicaCount=1`,
    `--set storage.size=10Gi`,
    `--set storage.storageClass=standard`,
    `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
    `--set genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set genesis.network=${celoEnv}`,
    `--set geth.use_static_ips=false`,
    `--set geth.syncmode=${syncmode}`,
    `--set geth.gcmode=full`,
  ]
}

export async function removeHelmRelease(celoEnv: string, syncmode: string, namespace: string) {
  const kubeNamespace = getKubeNamespace(celoEnv, namespace)
  const releaseName = getReleaseName(celoEnv, syncmode, kubeNamespace)

  await removeGenericHelmChart(releaseName)
  await deletePersistentVolumeClaimsCustomLabels(kubeNamespace, 'release', releaseName)
}

export async function upgradeFullNodeChart(
  celoEnv: string,
  syncmode: string,
  namespace: string,
  reset: boolean = false
) {
  const kubeNamespace = getKubeNamespace(celoEnv, namespace)
  const releaseName = getReleaseName(celoEnv, syncmode, kubeNamespace)

  if (reset) {
    await scaleResource(kubeNamespace, 'StatefulSet', `${releaseName}`, 0)
    await deletePersistentVolumeClaimsCustomLabels(kubeNamespace, 'release', releaseName)
  }
  await upgradeGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(celoEnv, syncmode, kubeNamespace)
  )
  await scaleResource(kubeNamespace, 'StatefulSet', `${releaseName}`, 1)
  return
}
