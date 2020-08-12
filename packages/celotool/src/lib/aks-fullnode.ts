import { range } from 'lodash'
import sleep from 'sleep-promise'
import {
  AzureClusterConfig,
  deallocateStaticIP,
  getAKSNodeResourceGroup,
  registerStaticIPIfNotRegistered
} from './azure'
import { baseHelmParameters, FullNodeDeploymentConfig, getKubeNamespace, getReleaseName, getStaticIPNamePrefix, upgradeBaseFullNodeChart } from './cloud-provider'
import { createNamespaceIfNotExists } from './cluster'
import { execCmdWithExitOnFailure } from './cmd-utils'
import {
  deletePersistentVolumeClaims,
  installGenericHelmChart,
  removeGenericHelmChart,
} from './helm_deploy'
import { deleteResource } from './kubernetes'

const helmChartPath = '../helm-charts/celo-fullnode'

export interface AKSFullNodeDeploymentConfig extends FullNodeDeploymentConfig {
  clusterConfig: AzureClusterConfig
}

export async function installAKSFullNodeChart(celoEnv: string, deploymentConfig: AKSFullNodeDeploymentConfig) {
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

export async function upgradeAKSFullNodeChart(
  celoEnv: string,
  deploymentConfig: AKSFullNodeDeploymentConfig,
  reset: boolean
) {
  const kubeNamespace = getKubeNamespace(celoEnv)
  const aksHelmParameters = await helmParameters(celoEnv, kubeNamespace, deploymentConfig)

  await upgradeBaseFullNodeChart(celoEnv, deploymentConfig, reset, aksHelmParameters)
  return
}

export async function removeAKSFullNodeChart(celoEnv: string, deploymentConfig: AKSFullNodeDeploymentConfig) {
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
  const staticIps = (await allocateStaticIPs(celoEnv, deploymentConfig)).join(',')
  const baseParams = await baseHelmParameters(celoEnv, kubeNamespace, deploymentConfig)
  const additionalParameters = [
    `--set geth.azure_provider=true`,
    `--set geth.public_ips='{${staticIps}}'`,
  ]
  return baseParams.concat(additionalParameters)
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
