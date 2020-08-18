import { range } from 'lodash'
import sleep from 'sleep-promise'
import {
  AzureClusterConfig,
  deallocateStaticIP,
  getAKSNodeResourceGroup,
  registerStaticIPIfNotRegistered
} from '../azure'
import { getStaticIPNamePrefix } from '../cloud-provider'
import { execCmdWithExitOnFailure } from '../cmd-utils'
import { deleteResource } from '../kubernetes'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'

export interface AKSFullNodeDeploymentConfig extends BaseFullNodeDeploymentConfig {
  clusterConfig: AzureClusterConfig
}

export class AKSFullNodeDeployer extends BaseFullNodeDeployer {
  async additionalHelmParameters(
    celoEnv: string,
  ) {
    const staticIps = (await this.allocateStaticIPs(celoEnv)).join(',')
    return [
      `--set geth.azure_provider=true`,
      `--set geth.public_ip_per_node='{${staticIps}}'`,
    ]
  }

  async allocateStaticIPs(celoEnv: string) {
    console.info(`Creating static IPs on Azure for ${celoEnv}`)
    const resourceGroup = await getAKSNodeResourceGroup(this.deploymentConfig.clusterConfig)
    const { replicas } = this.deploymentConfig
    // Deallocate static ip if we are scaling down the replica count
    const existingStaticIPsCount = await this.getAzureStaticIPsCount(celoEnv, resourceGroup)
    for (let i = existingStaticIPsCount - 1; i > replicas - 1; i--) {
      await deleteResource(celoEnv, 'service', `${celoEnv}-fullnodes-${i}`, false)
      await this.waitDeattachingStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
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


  async getAzureStaticIPsCount(celoEnv: string, resourceGroup: string) {
    const [staticIPsCount] = await execCmdWithExitOnFailure(
      `az network public-ip list --resource-group ${resourceGroup} --query "[?contains(name,'${getStaticIPNamePrefix(
        celoEnv
      )}')].{Name:name, IPAddress:ipAddress}" -o tsv | wc -l`
    )
    return parseInt(staticIPsCount.trim(), 10)
  }

  async deallocateIPs(celoEnv: string) {
    console.info(`Deallocating static IPs on Azure for ${celoEnv}`)

    const resourceGroup = await getAKSNodeResourceGroup(this.deploymentConfig.clusterConfig)
    const replicaCount = await this.getAzureStaticIPsCount(celoEnv, resourceGroup)

    await this.waitDeattachingStaticIPs(celoEnv)

    await Promise.all(
      range(replicaCount).map((i) =>
        deallocateStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
      )
    )
  }

  async waitDeattachingStaticIPs(celoEnv: string) {
    const resourceGroup = await getAKSNodeResourceGroup(this.deploymentConfig.clusterConfig)

    await Promise.all(
      range(this.deploymentConfig.replicas).map((i) =>
        this.waitDeattachingStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
      )
    )
  }

  async waitDeattachingStaticIP(name: string, resourceGroup: string) {
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


  get deploymentConfig(): AKSFullNodeDeploymentConfig {
    return this._deploymentConfig as AKSFullNodeDeploymentConfig
  }
}

// export async function installAKSFullNodeChart(celoEnv: string, deploymentConfig: AKSFullNodeDeploymentConfig) {
//   const kubeNamespace = getKubeNamespace(celoEnv)
//   const releaseName = getReleaseName(celoEnv)
//   await createNamespaceIfNotExists(kubeNamespace)
//
//   return installGenericHelmChart(
//     kubeNamespace,
//     releaseName,
//     helmChartPath,
//     await helmParameters(celoEnv, kubeNamespace, deploymentConfig)
//   )
// }

// export async function upgradeAKSFullNodeChart(
//   celoEnv: string,
//   deploymentConfig: AKSFullNodeDeploymentConfig,
//   reset: boolean
// ) {
//   const kubeNamespace = getKubeNamespace(celoEnv)
//   const aksHelmParameters = await helmParameters(celoEnv, kubeNamespace, deploymentConfig)
//
//   await upgradeBaseFullNodeChart(celoEnv, deploymentConfig, reset, aksHelmParameters)
//   return
// }

// export async function removeAKSFullNodeChart(celoEnv: string, deploymentConfig: AKSFullNodeDeploymentConfig) {
//   const releaseName = getReleaseName(celoEnv)
//   await removeGenericHelmChart(releaseName)
//   await deletePersistentVolumeClaims(celoEnv, ['celo-fullnode'])
//   await deallocateIPs(celoEnv, deploymentConfig)
// }


//
// async function getAzureStaticIPsCount(celoEnv: string, resourceGroup: string) {
//   const [staticIPsCount] = await execCmdWithExitOnFailure(
//     `az network public-ip list --resource-group ${resourceGroup} --query "[?contains(name,'${getStaticIPNamePrefix(
//       celoEnv
//     )}')].{Name:name, IPAddress:ipAddress}" -o tsv | wc -l`
//   )
//   return parseInt(staticIPsCount.trim(), 10)
// }
//
// async function deallocateIPs(celoEnv: string, deploymentConfig: AKSFullNodeDeploymentConfig) {
//   console.info(`Deallocating static IPs on Azure for ${celoEnv}`)
//
//   const resourceGroup = await getAKSNodeResourceGroup(deploymentConfig.clusterConfig)
//   const replicaCount = await getAzureStaticIPsCount(celoEnv, resourceGroup)
//
//   await waitDeattachingStaticIPs(celoEnv, deploymentConfig)
//
//   await Promise.all(
//     range(replicaCount).map((i) =>
//       deallocateStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
//     )
//   )
// }
//
// async function waitDeattachingStaticIPs(celoEnv: string, deploymentConfig: AKSFullNodeDeploymentConfig) {
//   const resourceGroup = await getAKSNodeResourceGroup(deploymentConfig.clusterConfig)
//
//   await Promise.all(
//     range(deploymentConfig.replicas).map((i) =>
//       waitDeattachingStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
//     )
//   )
// }
//
// async function waitDeattachingStaticIP(name: string, resourceGroup: string) {
//   const retries = 10
//   const sleepTime = 5
//   for (let i = 0; i <= retries; i++) {
//     const [allocated] = await execCmdWithExitOnFailure(
//       `az network public-ip show --resource-group ${resourceGroup} --name ${name} --query ipConfiguration.id -o tsv`
//     )
//     if (allocated.trim() === '') {
//       return true
//     }
//     sleep(sleepTime)
//   }
//   return false
// }
