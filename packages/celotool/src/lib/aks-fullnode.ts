import { range } from 'lodash'
import { getAKSNodeResourceGroup } from './azure'
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

  if (reset) {
    await scaleResource(celoEnv, 'StatefulSet', `${celoEnv}-fullnodes`, 0)
    await deletePersistentVolumeClaims(celoEnv, ['celo-fullnode'])
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
  await removeGenericHelmChart(releaseName)
  await deletePersistentVolumeClaims(celoEnv, ['celo-fullnode'])
  await deallocateIPs(celoEnv)
}

async function helmParameters(celoEnv: string, kubeNamespace: string) {
  const staticIps = (await createStaticIPs(celoEnv)).join(',')
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

async function createStaticIPs(celoEnv: string) {
  console.info(`Creating static IPs on Azure for ${celoEnv}`)
  const resourceGroup = await getAKSNodeResourceGroup()
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
  const resourceGroup = await getAKSNodeResourceGroup()

  await Promise.all(
    range(replicaCount).map((i) => deallocateIP(`${celoEnv}-validators-${i}`, resourceGroup))
  )
}

async function deallocateIP(name: string, resourceGroup: string) {
  console.info(`Deallocating IP address ${name} on ${resourceGroup}`)
  // TODO(jcortejoso): wait until ip is not associated to any resource
  return execCmdWithExitOnFailure(
    `az network public-ip delete --resource-group ${resourceGroup} --name ${name}`
  )
}
