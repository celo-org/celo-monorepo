import { range } from 'lodash'
import sleep from 'sleep-promise'
import { deallocateStaticIP, getAKSNodeResourceGroup, registerStaticIP } from './azure'
import { createNamespaceIfNotExists } from './cluster'
import { envVar, fetchEnv } from './env-utils'
import {
  deletePersistentVolumeClaims,
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from './helm_deploy'
import { scaleResource } from './kubernetes'
import { execCmdWithExitOnFailure } from './utils'

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

export async function installFullNodeChart(celoEnv: string) {
  const kubeNamespace = getKubeNamespace(celoEnv)
  const releaseName = getReleaseName(celoEnv)
  await createNamespaceIfNotExists(kubeNamespace)

  return installGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(celoEnv, kubeNamespace)
  )
}

export async function upgradeFullNodeChart(celoEnv: string, reset: boolean = false) {
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
    await helmParameters(celoEnv, kubeNamespace)
  )
  await scaleResource(celoEnv, 'StatefulSet', `${celoEnv}-fullnodes`, replicas)
  return
}

export async function removeHelmRelease(celoEnv: string) {
  const releaseName = getReleaseName(celoEnv)
  await removeGenericHelmChart(releaseName)
  await deletePersistentVolumeClaims(celoEnv, ['celo-fullnode'])
  await deallocateIPs(celoEnv)
}

async function helmParameters(celoEnv: string, kubeNamespace: string) {
  const staticIps = (await allocateStaticIPs(celoEnv)).join(',')
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

async function allocateStaticIPs(celoEnv: string) {
  console.info(`Creating static IPs on Azure for ${celoEnv}`)
  const resourceGroup = await getAKSNodeResourceGroup()
  const replicaCount = getReplicaCount()

  // Deallocate static ip if we are scaling down the replica count
  const existingStaticIPsCount = await getAzureStaticIPsCount(celoEnv, resourceGroup)
  for (let i = existingStaticIPsCount; i > replicaCount; i--) {
    await deallocateStaticIP(`${getStaticIPNamePrefix(celoEnv)}-0`, resourceGroup)
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

async function deallocateIPs(celoEnv: string) {
  console.info(`Deallocating static IPs on Azure for ${celoEnv}`)

  const resourceGroup = await getAKSNodeResourceGroup()
  const replicaCount = await getAzureStaticIPsCount(celoEnv, resourceGroup)

  await waitDeattachingStaticIPs(celoEnv)

  await Promise.all(
    range(replicaCount).map((i) =>
      deallocateStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
    )
  )
}

async function waitDeattachingStaticIPs(celoEnv: string) {
  const replicaCount = getReplicaCount()
  const resourceGroup = await getAKSNodeResourceGroup()

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
