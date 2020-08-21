import { range } from 'lodash'
import { deallocateAWSStaticIP, describeElasticIPAddresses, getElasticIPAddressesFromAllocationIDs, getOrRegisterElasticIP, tagsArrayToAWSResourceTags, waitForElasticIPAssociationIDRemoval } from '../aws'
import { execCmdWithExitOnFailure } from '../cmd-utils'
import { AWSClusterConfig } from '../k8s-cluster/aws'
import { deleteResource } from '../kubernetes'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'

export interface AWSFullNodeDeploymentConfig extends BaseFullNodeDeploymentConfig {
  clusterConfig: AWSClusterConfig
}

export class AWSFullNodeDeployer extends BaseFullNodeDeployer {

  async additionalHelmParameters() {
    const allocationIdsPerNode: string[][] = await this.allocateElasticIPs()
    const allocationIdsPerNodeParamStr = allocationIdsPerNode.map((ips: string[]) =>
      ips.join('\\\,')
    ).join(',')
    // Arbitrarily pick the first IP address for each node.
    // TODO make this smarter
    const ipPerNode = await getElasticIPAddressesFromAllocationIDs(
      allocationIdsPerNode.map((allocationIDs: string[]) => allocationIDs[0])
    )

    return [
      `--set geth.azure_provider=false`,
      `--set geth.eip_allocation_ids_per_node='{${allocationIdsPerNodeParamStr}}'`,
      `--set geth.public_ip_per_node='{${ipPerNode.join(',')}}'`,
      `--set storage.storageClass=gp2`,
    ]
  }

  /**
   * AWS requires each load balancer to have N IP addresses where there N public
   * subnets. An EKS cluster that is distributed across multiple availability zones
   * will have multiple subnets. We therefore have each full node have N IP addresses,
   * and return them in a 2d array of allocation IDs.
   * This function will also remove any unused IP addresses from past deployments.
   * @param celoEnv
   * @param deploymentConfig
   */
  async allocateElasticIPs() {
    const { replicas } = this.deploymentConfig

    // Get existing elastic IPs with tags that indicate they are from a previous deployment
    const existingElasticIPs = await describeElasticIPAddresses(this.genericElasticIPTags)
    const subnets = await this.getPublicSubnets()

    // Remove any IPs that shouldn't exist
    const deallocationPromises = []
    for (const existingIP of existingElasticIPs.Addresses) {
      const tags = tagsArrayToAWSResourceTags(existingIP.Tags)
      // Ideally should never happen, but to be safe check
      const index = parseInt(tags.index, 10)
      if (isNaN(index)) {
        deallocationPromises.push(this.deallocateElasticIP(existingIP.AllocationId))
        continue
      }
      // index too large - this would happen if the # of nodes was scaled down
      // in this deployment
      const serviceName = `${this.celoEnv}-fullnodes-${index}`
      if (index >= replicas) {
        deallocationPromises.push(this.deallocateElasticIP(existingIP.AllocationId, serviceName))
        continue
      }
      // subnet doesn't exist - if for some reason subnets changed, this would occur
      if (!subnets.includes(tags.subnet)) {
        deallocationPromises.push(this.deallocateElasticIP(existingIP.AllocationId, serviceName))
        continue
      }
    }
    await Promise.all(deallocationPromises)

    // This is a 2d array of allocation IDs. Each element of the array corresponds
    // to the full node with the same index, which has 1 IP per subnet.
    const allocationIdsPerFullNode = await Promise.all(
      range(replicas).map((i) =>
        Promise.all(
          subnets.map((subnet: string) =>
            getOrRegisterElasticIP(this.getElasticIPTags(subnet, i))
          )
        )
      )
    )
    return allocationIdsPerFullNode
  }

  async getPublicSubnets(): Promise<string[]> {
    const clusterName: string = this.deploymentConfig.clusterConfig.clusterName
    const [subnets] = await execCmdWithExitOnFailure(
      `aws ec2 describe-subnets --filters "Name=tag-key,Values=kubernetes.io/cluster/${clusterName}" "Name=tag-key,Values=kubernetes.io/role/elb" --query "Subnets[*].SubnetId" --output json`
    )
    return JSON.parse(subnets)
  }

  /**
   *
   */
  async deallocateAllIPs() {
    const existingElasticIPs = await describeElasticIPAddresses(this.genericElasticIPTags)
    await Promise.all(
      existingElasticIPs.Addresses.map((elasticIP: any) =>
        this.deallocateElasticIP(elasticIP.AllocationId)
      )
    )
  }

  async deallocateElasticIP(allocationID: string, kubeServiceName?: string) {
    if (kubeServiceName) {
      await deleteResource(this.celoEnv, 'service', kubeServiceName, true)
    }
    await waitForElasticIPAssociationIDRemoval(allocationID)
    await deallocateAWSStaticIP(allocationID)
  }

  getElasticIPTags(subnet: string, index: number) {
    return {
      ...this.genericElasticIPTags,
      Name: `${this.staticIPNamePrefix}-${index}-${subnet}`,
      index: index.toString(10),
      subnet,
    }
  }

  get genericElasticIPTags() {
    return {
      resourceGroup: this.deploymentConfig.clusterConfig.resourceGroupTag,
      celoEnv: this.celoEnv,
      namePrefix: this.staticIPNamePrefix,
    }
  }

  get deploymentConfig(): AWSFullNodeDeploymentConfig {
    return this._deploymentConfig as AWSFullNodeDeploymentConfig
  }
}
