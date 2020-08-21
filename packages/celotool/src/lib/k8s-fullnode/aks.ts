import { range } from 'lodash'
import sleep from 'sleep-promise'
import {
  AzureClusterConfig,
  deallocateStaticIP,
  getAKSNodeResourceGroup,
  registerStaticIPIfNotRegistered
} from '../azure'
import { execCmdWithExitOnFailure } from '../cmd-utils'
import { deleteResource } from '../kubernetes'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'

export interface AKSFullNodeDeploymentConfig extends BaseFullNodeDeploymentConfig {
  clusterConfig: AzureClusterConfig
}

export class AKSFullNodeDeployer extends BaseFullNodeDeployer {
  async additionalHelmParameters() {
    const staticIps = (await this.allocateStaticIPs()).join(',')
    return [
      `--set geth.azure_provider=true`,
      `--set geth.public_ip_per_node='{${staticIps}}'`,
    ]
  }

  async allocateStaticIPs() {
    console.info(`Creating static IPs on Azure for ${this.celoEnv}`)
    const resourceGroup = await getAKSNodeResourceGroup(this.deploymentConfig.clusterConfig)
    const { replicas } = this.deploymentConfig
    // Deallocate static ip if we are scaling down the replica count
    const existingStaticIPsCount = await this.getAzureStaticIPsCount(resourceGroup)
    for (let i = existingStaticIPsCount - 1; i > replicas - 1; i--) {
      await deleteResource(this.celoEnv, 'service', `${this.celoEnv}-fullnodes-${i}`, false)
      await this.waitDeattachingStaticIP(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
      await deallocateStaticIP(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
    }

    const staticIps = await Promise.all(
      range(replicas).map((i) =>
        registerStaticIPIfNotRegistered(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
      )
    )

    const addresses = staticIps.map((address, _) => address)

    return addresses
  }


  async getAzureStaticIPsCount(resourceGroup: string) {
    const [staticIPsCount] = await execCmdWithExitOnFailure(
      `az network public-ip list --resource-group ${resourceGroup} --query "[?contains(name,'${this.staticIPNamePrefix}')].{Name:name, IPAddress:ipAddress}" -o tsv | wc -l`
    )
    return parseInt(staticIPsCount.trim(), 10)
  }

  async deallocateAllIPs() {
    console.info(`Deallocating static IPs on Azure for ${this.celoEnv}`)

    const resourceGroup = await getAKSNodeResourceGroup(this.deploymentConfig.clusterConfig)
    const replicaCount = await this.getAzureStaticIPsCount(resourceGroup)

    await this.waitDeattachingStaticIPs()

    await Promise.all(
      range(replicaCount).map((i) =>
        deallocateStaticIP(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
      )
    )
  }

  async waitDeattachingStaticIPs() {
    const resourceGroup = await getAKSNodeResourceGroup(this.deploymentConfig.clusterConfig)

    await Promise.all(
      range(this.deploymentConfig.replicas).map((i) =>
        this.waitDeattachingStaticIP(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
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
