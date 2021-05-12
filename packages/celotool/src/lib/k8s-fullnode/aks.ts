import { range } from 'lodash'
import {
  deallocateStaticIP,
  getAKSNodeResourceGroup,
  registerStaticIPIfNotRegistered,
  waitForStaticIPDetachment,
} from '../azure'
import { execCmdWithExitOnFailure } from '../cmd-utils'
import { AksClusterConfig } from '../k8s-cluster/aks'
import { deleteResource } from '../kubernetes'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'

export interface AksFullNodeDeploymentConfig extends BaseFullNodeDeploymentConfig {
  clusterConfig: AksClusterConfig
}

export class AksFullNodeDeployer extends BaseFullNodeDeployer {
  async additionalHelmParameters() {
    const staticIps = (await this.allocateStaticIPs()).join(',')
    return [
      `--set azure=true`,
      `--set geth.public_ip_per_node='{${staticIps}}'`,
      // Azure has a special annotation to expose TCP and UDP on the same service.
      // Only TCP needs to be specified in that case.
      `--set geth.service_protocols='{TCP}'`,
      // Fix for LES server panic-- don't serve any LES clients!
      `--set geth.maxpeers=150`,
      `--set geth.light.maxpeers=0`,
      `--set geth.light.serve=0`,
      `--set geth.use_gstorage_data=false`,
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
      await waitForStaticIPDetachment(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
      await deallocateStaticIP(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
    }

    const addresses = await Promise.all(
      range(replicas).map((i) =>
        registerStaticIPIfNotRegistered(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
      )
    )

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

    await this.waitForAllStaticIPDetachment()

    await Promise.all(
      range(replicaCount).map((i) =>
        deallocateStaticIP(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
      )
    )
  }

  async waitForAllStaticIPDetachment() {
    const resourceGroup = await getAKSNodeResourceGroup(this.deploymentConfig.clusterConfig)

    await Promise.all(
      range(this.deploymentConfig.replicas).map((i) =>
        waitForStaticIPDetachment(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
      )
    )
  }

  async getFullNodeIP(index: number, resourceGroup?: string): Promise<string> {
    resourceGroup =
      resourceGroup || (await getAKSNodeResourceGroup(this.deploymentConfig.clusterConfig))
    return registerStaticIPIfNotRegistered(`${this.staticIPNamePrefix}-${index}`, resourceGroup)
  }

  get deploymentConfig(): AksFullNodeDeploymentConfig {
    return this._deploymentConfig as AksFullNodeDeploymentConfig
  }
}
