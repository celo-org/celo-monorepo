import { range } from 'lodash'
import sleep from 'sleep-promise'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'
import { AwsClusterConfig, deallocateAWSStaticIP, registerAWSStaticIPIfNotRegistered } from '../aws'
import { getStaticIPNamePrefix } from '../cloud-provider'
import { execCmdWithExitOnFailure } from '../cmd-utils'
import { deleteResource } from '../kubernetes'

export interface AWSFullNodeDeploymentConfig extends BaseFullNodeDeploymentConfig {
  clusterConfig: AwsClusterConfig
}

export class AWSFullNodeDeployer extends BaseFullNodeDeployer {
  constructor(deploymentConfig: AWSFullNodeDeploymentConfig) {
    super(deploymentConfig)
  }

  async additionalHelmParameters(
    celoEnv: string,
  ) {
    const allocationIdsPerNode: string[][] = await this.allocateStaticIPs(celoEnv)
    const allocationIdsPerNodeParamStr = allocationIdsPerNode.map((ips: string[]) =>
      ips.join('\\\,')
    ).join(',')
    console.info('allocationIdsPerNode', allocationIdsPerNode)
    console.info('allocationIdsPerNodeParamStr', allocationIdsPerNodeParamStr)
    const staticIps = (await this.fetchStaticIPAddresses(allocationIdsPerNode.map((ips: string[]) => ips[0]))).join(',')
    // const subnetCount = (await getSubnetCount(deploymentConfig))

    console.info('staticIps', staticIps)
    return [
      `--set geth.azure_provider=false`,
      `--set geth.eip_allocation_ids_per_node='{${allocationIdsPerNodeParamStr}}'`,
      `--set geth.public_ip_per_node='{${staticIps}}'`,
      `--set storage.storageClass=gp2`,
    ]
  }

  /**
   * Returns a list of Allocation Ids corresponded to allocated static IPs
   * @param celoEnv
   * @param deploymentConfig
   */
  async allocateStaticIPs(celoEnv: string) {
    console.info(`Creating static IPs on AWS for ${celoEnv}`)
    // const resourceGroup = await getAKSNodeResourceGroup(deploymentConfig.clusterConfig)
    const resourceGroup = this.deploymentConfig.clusterConfig.resourceGroupTag
    const { replicas } = this.deploymentConfig
    if (false) {
      // Deallocate static ip if we are scaling down the replica count
      const existingStaticIPsCount = await this.getAWSStaticIPsCount(resourceGroup)
      for (let i = existingStaticIPsCount - 1; i > replicas - 1; i--) {
        await deleteResource(celoEnv, 'service', `${celoEnv}-fullnodes-${i}`, false)
        await this.waitDeattachingStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
        await deallocateAWSStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
      }
    }

    const subnets = await this.getPublicSubnets()
    const staticAllocationIdsPerFullNode = await Promise.all(
      range(replicas).map((i) =>
        Promise.all(
          subnets.map((subnet: string) =>
            registerAWSStaticIPIfNotRegistered(`${getStaticIPNamePrefix(celoEnv)}-${i}-${subnet}`, resourceGroup)
          )
        )
      )
    )

    return staticAllocationIdsPerFullNode // .map((allocationID, _) => allocationID)
  }


  // IP related functions
  // IP addresses in AWS will have the following tags:
  // tag=resourceGroupTag Value=DynamicEnvVar.ORACLE_RESOURCE_GROUP_TAG
  // tag=IPNodeName Value=`${getStaticIPNamePrefix(celoEnv)}-${i}`

  async getPublicSubnets(): Promise<string[]> {
    const clusterName: string = this.deploymentConfig.clusterConfig.clusterName
    const [subnetCount] = await execCmdWithExitOnFailure(
      `aws ec2 describe-subnets --filters "Name=tag-key,Values=kubernetes.io/cluster/${clusterName}" "Name=tag-key,Values=kubernetes.io/role/elb" --query "Subnets[*].SubnetId" --output json`
    )
    return JSON.parse(subnetCount.trim())
  }

  async fetchStaticIPAddresses(allocationIDs: string[]) {
    const addresses = await Promise.all(allocationIDs.map((allocId) => (this.fetchStaticIPAddress(allocId))))
    return addresses
  }

  async fetchStaticIPAddress(allocationId: string) {
    const [staticIp] = await execCmdWithExitOnFailure(
    `aws ec2 describe-addresses --allocation-ids ${allocationId} --query 'Addresses[*].[PublicIp]' --output text`
    )
    return staticIp.trim()
  }

  async getAWSStaticIPsCount(resourceGroup: string) {
    // This gets the count of allocated IP Addresses that has resourceGroup as the value for tag resourceGroupTag and CONTAINS a tag key (ignores value) for "IPNodeName"
    const [staticIPsCount] = await execCmdWithExitOnFailure(
      `aws ec2 describe-addresses --filters "Name=tag:resourceGroupTag,Values=${resourceGroup}" "Name=tag-key,Values=IPNodeName" --query "Addresses[*].[PublicIp]" --output text | wc -l`
    )
    return parseInt(staticIPsCount.trim(), 10)
  }

  async waitDeattachingStaticIPs(celoEnv: string, deploymentConfig: AWSFullNodeDeploymentConfig) {
    const resourceGroup = deploymentConfig.clusterConfig.resourceGroupTag

    await Promise.all(
      range(deploymentConfig.replicas).map((i) =>
        this.waitDeattachingStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
      )
    )
  }

  async waitDeattachingStaticIP(name: string, resourceGroup: string) {
    const retries = 10
    const sleepTime = 5
    for (let i = 0; i <= retries; i++) {
      // const [allocated] = await execCmdWithExitOnFailure(
      //   `az network public-ip show --resource-group ${resourceGroup} --name ${name} --query ipConfiguration.id -o tsv`
      // )
      console.info(`${name} being deattached form ${resourceGroup}`)
      const allocated = ''
      if (allocated.trim() === '') {
        return true
      }
      sleep(sleepTime)
    }
    return false
  }

  async deallocateIPs(celoEnv: string) {
    console.info(`Deallocating static IPs on AWS for ${celoEnv}`)

    const resourceGroup = this.deploymentConfig.clusterConfig.resourceGroupTag
    const replicaCount = await this.getAWSStaticIPsCount(resourceGroup)

    await this.waitDeattachingStaticIPs(celoEnv, this.deploymentConfig)

    await Promise.all(
      range(replicaCount).map((i) =>
        deallocateAWSStaticIP(`${getStaticIPNamePrefix(celoEnv)}-${i}`, resourceGroup)
      )
    )
  }

  get deploymentConfig(): AWSFullNodeDeploymentConfig {
    return this._deploymentConfig as AWSFullNodeDeploymentConfig
  }
}

// export async function installAWSFullNodeChart(celoEnv: string, deploymentConfig: AWSFullNodeDeploymentConfig) {
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

// export async function upgradeAWSFullNodeChart(
//   celoEnv: string,
//   deploymentConfig: AWSFullNodeDeploymentConfig,
//   reset: boolean
// ) {
//   const kubeNamespace = getKubeNamespace(celoEnv)
//   const aksHelmParameters = await helmParameters(celoEnv, kubeNamespace, deploymentConfig)
//
//   return upgradeBaseFullNodeChart(celoEnv, deploymentConfig, reset, aksHelmParameters)
// }

// export async function removeAWSFullNodeChart(celoEnv: string, deploymentConfig: AWSFullNodeDeploymentConfig) {
//   const releaseName = getReleaseName(celoEnv)
//   await removeGenericHelmChart(releaseName)
//   await deletePersistentVolumeClaims(celoEnv, ['celo-fullnode'])
//   await deallocateIPs(celoEnv, deploymentConfig)
// }

// async function helmParameters(
//   celoEnv: string,
//   kubeNamespace: string,
//   deploymentConfig: AWSFullNodeDeploymentConfig
// ) {
//   const allocationIdsPerNode: string[][] = await allocateStaticIPs(celoEnv, deploymentConfig)
//   const allocationIdsPerNodeParamStr = allocationIdsPerNode.map((ips: string[]) =>
//     ips.join('\\\,')
//   ).join(',')
//   console.info('allocationIdsPerNode', allocationIdsPerNode)
//   console.info('allocationIdsPerNodeParamStr', allocationIdsPerNodeParamStr)
//   const staticIps = (await fetchStaticIPAddresses(allocationIdsPerNode.map((ips: string[]) => ips[0]))).join(',')
//   // const subnetCount = (await getSubnetCount(deploymentConfig))
//
//   console.info('staticIps', staticIps)
//   const baseparams = await baseHelmParameters(celoEnv, kubeNamespace, deploymentConfig)
//   const additionalParameters = [
//     `--set geth.azure_provider=false`,
//     `--set geth.eip_allocation_ids_per_node='{${allocationIdsPerNodeParamStr}}'`,
//     `--set geth.public_ip_per_node='{${staticIps}}'`,
//     `--set storage.storageClass=gp2`,
//     // `--set geth.subnet_count='{${subnetCount}}'`,
//   ]
//   return baseparams.concat(additionalParameters)
// }
