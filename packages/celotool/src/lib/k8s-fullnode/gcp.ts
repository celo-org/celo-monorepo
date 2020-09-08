// import { range } from 'lodash'
// import {
//   deallocateStaticIP,
//   getAKSNodeResourceGroup,
//   registerStaticIPIfNotRegistered,
//   waitForStaticIPDetachment
// } from '../azure'
// import { execCmdWithExitOnFailure } from '../cmd-utils'
import { GCPClusterConfig } from '../k8s-cluster/gcp'
// import { deleteResource } from '../kubernetes'
import { /*BaseFullNodeDeployer,*/ BaseFullNodeDeploymentConfig } from './base'
//
export interface GCPFullNodeDeploymentConfig extends BaseFullNodeDeploymentConfig {
  clusterConfig: GCPClusterConfig,
}

// export class AKSFullNodeDeployer extends BaseFullNodeDeployer {
//   async additionalHelmParameters() {
//     const staticIps = (await this.allocateStaticIPs()).join(',')
//     return [
//       `--set gcp=true`,
//       `--set geth.public_ip_per_node='{${staticIps}}'`,
//     ]
//   }
//
//   async allocateStaticIPs() {
//     console.info(`Creating static IPs on Azure for ${this.celoEnv}`)
//     const resourceGroup = await getAKSNodeResourceGroup(this.deploymentConfig.clusterConfig)
//     const { replicas } = this.deploymentConfig
//     // Deallocate static ip if we are scaling down the replica count
//     const existingStaticIPsCount = await this.getAzureStaticIPsCount(resourceGroup)
//     for (let i = existingStaticIPsCount - 1; i > replicas - 1; i--) {
//       await deleteResource(this.celoEnv, 'service', `${this.celoEnv}-fullnodes-${i}`, false)
//       await waitForStaticIPDetachment(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
//       await deallocateStaticIP(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
//     }
//
//     const staticIps = await Promise.all(
//       range(replicas).map((i) =>
//         registerStaticIPIfNotRegistered(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
//       )
//     )
//
//     const addresses = staticIps.map((address, _) => address)
//
//     return addresses
//   }
//
//   async getAzureStaticIPsCount(resourceGroup: string) {
//     const [staticIPsCount] = await execCmdWithExitOnFailure(
//       `az network public-ip list --resource-group ${resourceGroup} --query "[?contains(name,'${this.staticIPNamePrefix}')].{Name:name, IPAddress:ipAddress}" -o tsv | wc -l`
//     )
//     return parseInt(staticIPsCount.trim(), 10)
//   }
//
//   async deallocateAllIPs() {
//     console.info(`Deallocating static IPs on Azure for ${this.celoEnv}`)
//
//     const resourceGroup = await getAKSNodeResourceGroup(this.deploymentConfig.clusterConfig)
//     const replicaCount = await this.getAzureStaticIPsCount(resourceGroup)
//
//     await this.waitForAllStaticIPDetachment()
//
//     await Promise.all(
//       range(replicaCount).map((i) =>
//         deallocateStaticIP(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
//       )
//     )
//   }
//
//   async waitForAllStaticIPDetachment() {
//     const resourceGroup = await getAKSNodeResourceGroup(this.deploymentConfig.clusterConfig)
//
//     await Promise.all(
//       range(this.deploymentConfig.replicas).map((i) =>
//         waitForStaticIPDetachment(`${this.staticIPNamePrefix}-${i}`, resourceGroup)
//       )
//     )
//   }
//
//   get deploymentConfig(): AKSFullNodeDeploymentConfig {
//     return this._deploymentConfig as AKSFullNodeDeploymentConfig
//   }
// }
