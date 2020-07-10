import { range } from 'lodash'
import sleep from 'sleep-promise'
import {
  AzureClusterConfig,
  deallocateStaticIP,
  getAKSNodeResourceGroup,
  registerStaticIPIfNotRegistered,
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

export interface FullNodeDeploymentConfig {
  diskSizeGb: number
  replicas: number
}

export interface AKSFullNodeDeploymentConfig extends FullNodeDeploymentConfig {
  clusterConfig: AzureClusterConfig
}

export function getReleaseName(celoEnv: string) {
  return `${celoEnv}-fullnodes`
}

export function getKubeNamespace(celoEnv: string) {
  return celoEnv
}

function getStaticIPNamePrefix(celoEnv: string) {
  return `${celoEnv}-nodes`
}

export async function installFullNodeChart(celoEnv: string, deploymentConfig: AKSFullNodeDeploymentConfig) {
  const kubeNamespace = getKubeNamespace(celoEnv)
  const releaseName = getReleaseName(celoEnv)
  await createNamespaceIfNotExists(kubeNamespace)

  return installGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(celoEnv, kubeNamespace, deploymentConfig)
  )
}

export async function upgradeFullNodeChart(
  celoEnv: string,
  deploymentConfig: AKSFullNodeDeploymentConfig,
  reset: boolean
) {
  const kubeNamespace = getKubeNamespace(celoEnv)
  const releaseName = getReleaseName(celoEnv)

  if (reset) {
    await scaleResource(celoEnv, 'StatefulSet', `${celoEnv}-fullnodes`, 0)
    await deletePersistentVolumeClaims(celoEnv, ['celo-fullnode'])
  }
  await upgradeGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(celoEnv, kubeNamespace, deploymentConfig)
  )
  await scaleResource(celoEnv, 'StatefulSet', `${celoEnv}-fullnodes`, deploymentConfig.replicas)
  return
}

export async function removeFullNodeChart(celoEnv: string, deploymentConfig: AKSFullNodeDeploymentConfig) {
  const releaseName = getReleaseName(celoEnv)
  await removeGenericHelmChart(releaseName)
  await deletePersistentVolumeClaims(celoEnv, ['celo-fullnode'])
  await deallocateIPs(celoEnv, deploymentConfig)
}

async function helmParameters(
  celoEnv: string,
  kubeNamespace: string,
  deploymentConfig: AKSFullNodeDeploymentConfig
) {
  const rpcApis = 'eth,net,rpc,web3'
  const staticIps = (await allocateStaticIPs(celoEnv, deploymentConfig)).join(',')
  return [
    `--set namespace=${kubeNamespace}`,
    `--set replicaCount=${deploymentConfig.replicas}`,
    `--set storage.size=${deploymentConfig.diskSizeGb}Gi`,
    `--set geth.expose_rpc_externally=false`,
    `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
    `--set geth.public_ips='{${staticIps}}'`,
    `--set-string geth.rpc_apis='${rpcApis.split(',').join('\\\,')}'`,
    `--set genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set genesis.network=${celoEnv}`,
  ]
}

async function allocateStaticIPs(celoEnv: string, deploymentConfig: AKSFullNodeDeploymentConfig) {
  console.info(`Creating static IPs on Azure for ${celoEnv}`)
  const resourceGroup = await getAKSNodeResourceGroup(deploymentConfig.clusterConfig)
  const { replicas } = deploymentConfig
  // Deallocate static ip if we are scaling down the replica count
  const existingStaticIPsCount = await getAzureStaticIPsCount(celoEnv, resourceGroup)
  for (let i = existingStaticIPsCount - 1; i > replicas - 1; i--) {
    await deleteResource(celoEnv, 'service', `${celoEnv}-fullnodes-${i}`, false)
    await waitDeattachingStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
    await deallocateStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
  }

  const staticIps = await Promise.all(
    range(replicas).map((i) =>
      registerStaticIPIfNotRegistered(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
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

async function deallocateIPs(celoEnv: string, deploymentConfig: AKSFullNodeDeploymentConfig) {
  console.info(`Deallocating static IPs on Azure for ${celoEnv}`)

  const resourceGroup = await getAKSNodeResourceGroup(deploymentConfig.clusterConfig)
  const replicaCount = await getAzureStaticIPsCount(celoEnv, resourceGroup)

  await waitDeattachingStaticIPs(celoEnv, deploymentConfig)

  await Promise.all(
    range(replicaCount).map((i) =>
      deallocateStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
    )
  )
}

async function waitDeattachingStaticIPs(celoEnv: string, deploymentConfig: AKSFullNodeDeploymentConfig) {
  const resourceGroup = await getAKSNodeResourceGroup(deploymentConfig.clusterConfig)

  await Promise.all(
    range(deploymentConfig.replicas).map((i) =>
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
