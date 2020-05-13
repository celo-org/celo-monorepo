import { range } from 'lodash'
import sleep from 'sleep-promise'
import {
  AzureClusterConfig,
  deallocateStaticIP,
  getAKSNodeResourceGroup,
  registerStaticIP,
} from './azure'
import { createNamespaceIfNotExists } from './cluster'
import { execCmdWithExitOnFailure } from './cmd-utils'
import { envVar, fetchEnv } from './env-utils'
import {
  deletePersistentVolumeClaims,
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from './helm_deploy'
import { deleteResource, scaleResource } from './kubernetes'

const helmChartPath = '../helm-charts/celo-fullnode'

export function getReleaseName(celoEnv: string) {
  return `${celoEnv}-fullnodes`
}

export function getKubeNamespace(celoEnv: string) {
  return celoEnv
}

function getStaticIPNamePrefix(celoEnv: string) {
  return `${celoEnv}-nodes`
}

export function getReplicaCount() {
  return parseInt(fetchEnv(envVar.AZURE_TX_NODES_COUNT), 10)
}

export async function installFullNodeChart(celoEnv: string, clusterConfig: AzureClusterConfig) {
  const kubeNamespace = getKubeNamespace(celoEnv)
  const releaseName = getReleaseName(celoEnv)
  await createNamespaceIfNotExists(kubeNamespace)

  return installGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(celoEnv, kubeNamespace, clusterConfig)
  )
}

export async function upgradeFullNodeChart(
  celoEnv: string,
  clusterConfig: AzureClusterConfig,
  reset: boolean = false
) {
  const kubeNamespace = getKubeNamespace(celoEnv)
  const releaseName = getReleaseName(celoEnv)
  const replicas = getReplicaCount()

  if (reset) {
    await scaleResource(celoEnv, 'StatefulSet', `${celoEnv}-fullnodes`, 0)
    await deletePersistentVolumeClaims(celoEnv, ['celo-fullnode'])
  }
  await upgradeGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(celoEnv, kubeNamespace, clusterConfig)
  )
  await scaleResource(celoEnv, 'StatefulSet', `${celoEnv}-fullnodes`, replicas)
  return
}

export async function removeHelmRelease(celoEnv: string, clusterConfig: AzureClusterConfig) {
  const releaseName = getReleaseName(celoEnv)
  await removeGenericHelmChart(releaseName)
  await deletePersistentVolumeClaims(celoEnv, ['celo-fullnode'])
  await deallocateIPs(celoEnv, clusterConfig)
}

async function helmParameters(
  celoEnv: string,
  kubeNamespace: string,
  clusterConfig: AzureClusterConfig
) {
  const staticIps = (await allocateStaticIPs(celoEnv, clusterConfig)).join(',')
  const replicaCount = getReplicaCount()
  return [
    `--set namespace=${kubeNamespace}`,
    `--set replicaCount=${replicaCount}`,
    `--set storage.size=${parseInt(fetchEnv(envVar.AZURE_TX_NODES_DISK_SIZE), 10)}Gi`,
    `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
    `--set geth.public_ips='{${staticIps}}'`,
    `--set genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set genesis.network=${celoEnv}`,
  ]
}

async function allocateStaticIPs(celoEnv: string, clusterConfig: AzureClusterConfig) {
  console.info(`Creating static IPs on Azure for ${celoEnv}`)
  const resourceGroup = await getAKSNodeResourceGroup(clusterConfig)
  const replicaCount = getReplicaCount()

  // Deallocate static ip if we are scaling down the replica count
  const existingStaticIPsCount = await getAzureStaticIPsCount(celoEnv, resourceGroup)
  for (let i = existingStaticIPsCount - 1; i > replicaCount - 1; i--) {
    await deleteResource(celoEnv, 'service', `${celoEnv}-fullnodes-${i}`, false)
    await waitDeattachingStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
    await deallocateStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
  }

  const staticIps = await Promise.all(
    range(replicaCount).map((i) =>
      registerStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
    )
  )

  const addresses = staticIps.map((address, _) => address)

  return addresses
}

async function getAzureStaticIPsCount(celoEnv: string, resourceGroup: string) {
  const [staticIPsCount] = await execCmdWithExitOnFailure(
    `az network public-ip list --resource-group ${resourceGroup} --query "[?contains(name,'${getStaticIPNamePrefix(
      celoEnv
    )}')].{Name:name, IPAddress:ipAddress}" -o tsv | wc -l`
  )
  return parseInt(staticIPsCount.trim(), 10)
}

async function deallocateIPs(celoEnv: string, clusterConfig: AzureClusterConfig) {
  console.info(`Deallocating static IPs on Azure for ${celoEnv}`)

  const resourceGroup = await getAKSNodeResourceGroup(clusterConfig)
  const replicaCount = await getAzureStaticIPsCount(celoEnv, resourceGroup)

  await waitDeattachingStaticIPs(celoEnv, clusterConfig)

  await Promise.all(
    range(replicaCount).map((i) =>
      deallocateStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
    )
  )
}

async function waitDeattachingStaticIPs(celoEnv: string, clusterConfig: AzureClusterConfig) {
  const replicaCount = getReplicaCount()
  const resourceGroup = await getAKSNodeResourceGroup(clusterConfig)

  await Promise.all(
    range(replicaCount).map((i) =>
      waitDeattachingStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
    )
  )
}

async function waitDeattachingStaticIP(name: string, resourceGroup: string) {
  const retries = 10
  const sleepTime = 5
  for (let i = 0; i <= retries; i++) {
    const [allocated] = await execCmdWithExitOnFailure(
      `az network public-ip show --resource-group ${resourceGroup} --name ${name} --query ipConfiguration.id -o tsv`
    )
    if (allocated.trim() === '') {
      return true
    }
    sleep(sleepTime)
  }
  return false
}
