import { range } from 'lodash'
import { createNamespaceIfNotExists } from './cluster'
import { envVar, fetchEnv } from './env-utils'
import {
  deletePersistentVolumeClaims,
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from './helm_deploy'
import { execCmdWithExitOnFailure } from './utils'

const helmChartPath = '../helm-charts/celo-fullnode'
// const releaseName = 'celo-fullnodes'
// const kubeNamespace = 'celo'

export function getReleaseName(celoEnv: string) {
  return `${celoEnv}-fullnodes`
}

export function getKubeNamespace(celoEnv: string) {
  return celoEnv
}

export function getReplicaCount() {
  return parseInt(fetchEnv(envVar.AZURE_TX_NODES_COUNT), 3)
}

export async function installFullNodeChart(celoEnv: string) {
  const kubeNamespace = getKubeNamespace(celoEnv)
  const releaseName = getReleaseName(celoEnv)
  await createNamespaceIfNotExists(kubeNamespace)
  const params = await helmParameters(celoEnv, kubeNamespace)
  console.info(`helmParams: ${params}`)
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
  const persistentVolumeClaimsLabels = ['']

  if (reset) {
    await deletePersistentVolumeClaims(celoEnv, persistentVolumeClaimsLabels)
  }
  return upgradeGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(celoEnv, kubeNamespace)
  )
}

export async function removeHelmRelease(celoEnv: string) {
  const releaseName = getReleaseName(celoEnv)
  await deallocateIPs(celoEnv)
  await removeGenericHelmChart(releaseName)
}

async function helmParameters(celoEnv: string, kubeNamespace: string) {
  const staticIps = (await createStaticIPs(celoEnv)).join(',')
  const replicaCount = getReplicaCount()
  return [
    `--set namespace=${kubeNamespace}`,
    `--set replicaCount=${replicaCount}`,
    `--set storage.size=${parseInt(fetchEnv(envVar.AZURE_TX_NODES_DISK_SIZE), 10)}`,
    `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
    // `--set geth.image.imagePullPolicy=Always`,
    `--set geth.public_ips='{${staticIps}}'`,
    `--set genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set genesis.network=${celoEnv}`,
  ]
}

async function createStaticIPs(celoEnv: string) {
  console.info(`Creating static IPs on Azure for ${celoEnv}`)
  const resourceGroup = fetchEnv(envVar.AZURE_KUBERNETES_RESOURCE_GROUP)
  const replicaCount = getReplicaCount()

  const staticIps = await Promise.all(
    range(replicaCount).map((i) => registerIPAddress(`${celoEnv}-validators-${i}`, resourceGroup))
  )

  const addresses = staticIps.map((address, _) => address)

  return addresses
}

async function registerIPAddress(name: string, resourceGroup: string) {
  console.info(`Registering IP address ${name} on ${resourceGroup}`)
  const [address] = await execCmdWithExitOnFailure(
    `az network public-ip create --resource-group ${resourceGroup} --name ${name} --allocation-method Static --sku Standard --query publicIp.ipAddress -o tsv`
  )
  return address.trim()
}

async function deallocateIPs(celoEnv: string) {
  console.info(`Deallocating static IPs on Azure for ${celoEnv}`)

  const replicaCount = getReplicaCount()
  const resourceGroup = fetchEnv(envVar.AZURE_KUBERNETES_RESOURCE_GROUP)

  await Promise.all(
    range(replicaCount).map((i) => deallocateIP(`${celoEnv}-validators-${i}`, resourceGroup))
  )
}

async function deallocateIP(name: string, resourceGroup: string) {
  console.info(`Deallocating IP address ${name} on ${resourceGroup}`)
  return execCmdWithExitOnFailure(
    `az network public-ip delete --resource-group ${resourceGroup} --name ${name}`
  )
}
