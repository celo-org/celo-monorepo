import { range } from 'lodash'
import { deallocateAWSStaticIP, describeElasticIPAddresses, getElasticIPAddressesFromAllocationIDs, getOrRegisterElasticIP, subnetIsPublic, tagsArrayToAWSResourceTags, waitForElasticIPAssociationIDRemoval } from '../aws'
import { execCmdWithExitOnFailure } from '../cmd-utils'
import { AWSClusterConfig } from '../k8s-cluster/aws'
import { deleteResource } from '../kubernetes'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'

export interface AWSFullNodeDeploymentConfig extends BaseFullNodeDeploymentConfig {
  clusterConfig: AWSClusterConfig
}

export class AWSFullNodeDeployer extends BaseFullNodeDeployer {

  async additionalHelmParameters() {
    const subnets = await this.getAllSubnetsSortedByAZ()
    console.log('subnets', subnets)
    const allocationIDPerPublicSubnetPerFullNode: Array<{
      [subnetID: string]: string
    }> = await this.allocateElasticIPs()
    console.log('allocationIDPerPublicSubnetPerFullNode', allocationIDPerPublicSubnetPerFullNode)
    const publicSubnets = subnets.filter(subnetIsPublic)

    const publicSubnetIDPerAZ: {
      [az: string]: string
    } = publicSubnets.reduce((
      agg: {
        [az: string]: string
      },
      subnet: any
    ) => {
      console.log('agg', agg, 'subnet.AvailabilityZone', subnet.AvailabilityZone)
      return {
        ...agg,
        [subnet.AvailabilityZone]: subnet.SubnetId
      }
    }, {})

    const allocationIDForEachPublicSubnetPerFullNode: string[][] = allocationIDPerPublicSubnetPerFullNode.map(
      (allocationIDPerPublicSubnet: {
        [subnetID: string]: string
      }) =>
        publicSubnets.map((publicSubnet: any) => allocationIDPerPublicSubnet[publicSubnet.SubnetId])
      )

    const ipAddressPerPublicSubnetPerFullNode: Array<{
      [subnetID: string]: string
    }> = await Promise.all(
      allocationIDPerPublicSubnetPerFullNode.map(
        async (allocationIDPerPublicSubnet: {
          [subnetID: string]: string
        }) => {
          const subnetIDs = Object.keys(allocationIDPerPublicSubnet)
          const allocIDs = subnetIDs.map((subnetID: string) => allocationIDPerPublicSubnet[subnetID])
          const ips = await getElasticIPAddressesFromAllocationIDs(allocIDs)
          let index = 0
          return subnetIDs.reduce((agg: {
            [subnetID: string]: string
          }, subnetID: string) => ({
            ...agg,
            [subnetID]: ips[index++]
          }), {})
        }
      )
    )

    console.log('ipAddressPerPublicSubnetPerFullNode', ipAddressPerPublicSubnetPerFullNode)

    console.log('publicSubnetIDPerAZ', publicSubnetIDPerAZ)

    const ipAddressForEachSubnetPerFullNode: string[][] = ipAddressPerPublicSubnetPerFullNode.map(
      (ipAddressPerPublicSubnet: {
        [subnetID: string]: string
      }) => {
        return subnets.map((subnet: any) => {
          console.log('subnet.AvailabilityZone', subnet.AvailabilityZone)
          console.log('publicSubnetIDPerAZ[subnet.AvailabilityZone]', publicSubnetIDPerAZ[subnet.AvailabilityZone])
          const publicSubnetIDForThisAZ = publicSubnetIDPerAZ[subnet.AvailabilityZone]
          return ipAddressPerPublicSubnet[publicSubnetIDForThisAZ]
       })
      }
    )

    console.log('ipAddressForEachSubnetPerFullNode', ipAddressForEachSubnetPerFullNode)

    const allocationIdsPerPublicSubnetPerNodeParamStr = allocationIDForEachPublicSubnetPerFullNode.map((allocIDs: string[]) =>
      allocIDs.join('\\\,')
    ).join(',')

    const subnetCIDRBlocks = subnets.map((subnet: any) => subnet.CidrBlock)
    console.log('subnetCIDRBlocks', subnetCIDRBlocks)

    const ipAddressesPerSubnetPerNode = ipAddressForEachSubnetPerFullNode.map((ips: string[]) =>
      ips.join('\\\,')
    )

    return [
      `--set geth.all_subnet_cidr_blocks='{${subnetCIDRBlocks.join(',')}}'`,
      `--set geth.azure_provider=false`,
      `--set geth.eip_allocation_ids_per_public_subnet_per_node='{${allocationIdsPerPublicSubnetPerNodeParamStr}}'`,
      `--set geth.ip_addresses_per_subnet_per_node='{${ipAddressesPerSubnetPerNode.join(',')}}'`,
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
    const subnets = await this.getAllSubnetsSortedByAZ()
    const publicSubnetIDs = subnets.filter(subnetIsPublic).map((subnet:any) => subnet.SubnetId)

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
      if (!publicSubnetIDs.includes(tags.subnetID)) {
        deallocationPromises.push(this.deallocateElasticIP(existingIP.AllocationId, serviceName))
        continue
      }
    }
    await Promise.all(deallocationPromises)

    const allocationIDPerSubnetPerFullNode: Array<{
      [subnetID: string]: string
    }> = await Promise.all(
      range(replicas).map(async (i) =>
        {
          const allocationIDPerSubnet: string[] = await Promise.all(
            publicSubnetIDs.map((subnet: string) =>
              getOrRegisterElasticIP(this.getElasticIPTags(subnet, i))
            )
          )
          let index = 0
          console.log('allocationIDPerSubnet', allocationIDPerSubnet)
          console.log('index', index)
          return allocationIDPerSubnet.reduce(
            (obj: {
              [subnetID: string]: string
            }, allocationID: string) => ({
              ...obj,
              [publicSubnetIDs[index++]]: allocationID
            }),
            {}
          )
        }
      )
    )
    return allocationIDPerSubnetPerFullNode

    // This is a 2d array of allocation IDs. Each element of the array corresponds
    // to the full node with the same index, which has 1 IP per subnet.
  }

  async getPublicSubnetIDs(): Promise<string[]> {
    const clusterName: string = this.deploymentConfig.clusterConfig.clusterName
    const [subnets] = await execCmdWithExitOnFailure(
      `aws ec2 describe-subnets --filters "Name=tag-key,Values=kubernetes.io/cluster/${clusterName}" "Name=tag-key,Values=kubernetes.io/role/elb" --query "Subnets[*].SubnetId" --output json`
    )
    return JSON.parse(subnets)
  }

  async getAllSubnetsSortedByAZ(): Promise<any> {
    const clusterName: string = this.deploymentConfig.clusterConfig.clusterName
    console.log(`aws ec2 describe-subnets --filters "Name=tag-key,Values=kubernetes.io/cluster/${clusterName}" --query "Subnets" --output json`)
    const [subnetsStr] = await execCmdWithExitOnFailure(
      `aws ec2 describe-subnets --filters "Name=tag-key,Values=kubernetes.io/cluster/${clusterName}" --query "Subnets" --output json`
    )
    const subnets = JSON.parse(subnetsStr)
    return subnets.sort((a: any, b: any) =>
      b.AvailabilityZone < a.AvailabilityZone ? 1 : -1
    )
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

  getElasticIPTags(subnetID: string, index: number) {
    return {
      ...this.genericElasticIPTags,
      Name: `${this.staticIPNamePrefix}-${index}-${subnetID}`,
      index: index.toString(10),
      subnetID,
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
