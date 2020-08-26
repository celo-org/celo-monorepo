import { range } from 'lodash'
import { deallocateAWSStaticIP, describeElasticIPAddresses, getAllSubnetsSortedByAZ, getElasticIPAddressesFromAllocationIDs, getOrRegisterElasticIP, subnetIsPublic, tagsArrayToAWSResourceTags, waitForElasticIPAssociationIDRemoval } from '../aws'
import { AWSClusterConfig } from '../k8s-cluster/aws'
import { deleteResource } from '../kubernetes'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'

export interface AWSFullNodeDeploymentConfig extends BaseFullNodeDeploymentConfig {
  clusterConfig: AWSClusterConfig
}

export class AWSFullNodeDeployer extends BaseFullNodeDeployer {

  /**
   * Gets AWS-specific helm parameters.
   * The most complicated part of this is to do with IP addresses.
   * A multi-availability zone (AZ) cluster will have multiple subnets, where
   * each subnet belongs to only one AZ. The recommended & default approach is to have
   * 1 public and 1 private subnet per AZ. A network load balancer requires
   * a distinct public elastic IP address per public subnet. So if there are N
   * subnets, we must supply N distinct elastic IP addresses for a particular
   * network load balancer. Because geth only accommodates using 1 public IP
   * address with the `--nat` flag, we must choose 1 of the N IP addresses for
   * geth to use. To be extra resilient to AZ failures, we want to make sure that
   * the IP address geth decides to use for the `--nat` flag is the IP address
   * that is being used by the network load balancer in the same AZ that the
   * geth pod has been scheduled.
   */
  async additionalHelmParameters() {
    // Gets public & private subnets
    const subnets = await this.getAllSubnetsSortedByAZ()
    // Gives a mapping of (public) subnetID -> allocationID for each full node
    const allocationIDPerPublicSubnetForEachFullNode: Array<{
      [subnetID: string]: string
    }> = await this.allocateElasticIPs()
    const publicSubnets = subnets.filter(subnetIsPublic)

    // Maps az -> (public) subnetID
    const publicSubnetIDPerAZ: {
      [az: string]: string
    } = publicSubnets.reduce((
      agg: {
        [az: string]: string
      },
      subnet: any
    ) => {
      return {
        ...agg,
        [subnet.AvailabilityZone]: subnet.SubnetId
      }
    }, {})

    // For each full node, gives an array of IP allocation IDs that will be used
    // for the full node's corresponding network load balancer. If there are N
    // subnets, there are N required IP addresses. The ordered list of IP allocation
    // IDs are assigned to subnets based off the alphabetical order of the AZs that the subnets
    // are in.
    const allocationIDForEachPublicSubnetForEachFullNode: string[][] = allocationIDPerPublicSubnetForEachFullNode.map(
      (allocationIDPerPublicSubnet: {
        [subnetID: string]: string
      }) =>
        publicSubnets.map((publicSubnet: any) => allocationIDPerPublicSubnet[publicSubnet.SubnetId])
      )

    // For each full node, gives a mapping of (public) subnetID -> IPv4 IP address
    const ipAddressPerPublicSubnetForEachFullNode: Array<{
      [subnetID: string]: string
    }> = await Promise.all(
      allocationIDPerPublicSubnetForEachFullNode.map(
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

    // For each full node, gives an array of the IP addresses that are intended to
    // be used with the corresponding subnets (public or private) when the subnets
    // are sorted by availability zone. Because a network load balancer assigns
    // an ordered list of IP addresses to subnets by sorting the subnets by AZ,
    // we can use this 2d array to let a pod determine which IP address to use for
    // the geth --nat flag if the pod knows which subnet it is in.
    const ipAddressForEachSubnetForEachFullNode: string[][] = ipAddressPerPublicSubnetForEachFullNode.map(
      (ipAddressPerPublicSubnet: {
        [subnetID: string]: string
      }) => {
        return subnets.map((subnet: any) => {
          const publicSubnetIDForThisAZ = publicSubnetIDPerAZ[subnet.AvailabilityZone]
          return ipAddressPerPublicSubnet[publicSubnetIDForThisAZ]
       })
      }
    )

    // Effectively an array of comma separated allocation IDs to pass to helm.
    // Gives the allocation IDs of the IP addresses for public subnets for
    // each full node to be used by the NLB.
    const allocationIdsPerPublicSubnetPerNodeParamStr = allocationIDForEachPublicSubnetForEachFullNode.map((allocIDs: string[]) =>
      allocIDs.join('\\\,')
    ).join(',')

    // Subnet CIDR blocks, sorted by AZ. Given these CIDR ranges, a pod can
    // determine which subnet it belongs to by looking at its own IP address
    const subnetCIDRBlocks = subnets.map((subnet: any) => subnet.CidrBlock)

    // An array of comma separated IPv4 addresses, each IP address corresponds
    // to a subnet when the subnets are sorted by AZ. For example, if there is a
    // public subnet PUBLIC_A, a private subnet PRIVATE_A, both in us-west2-a,
    // and the same for us-west2-b, public subnet PUBLIC_B, a private subnet PRIVATE_B,
    // then we get the sorted subnets PUBLIC_A, PRIVATE_A, PUBLIC_B, PRIVATE_B.
    // We then have IP address A.A.A.A and B.B.B.B, each in zones us-west2-a and
    // us-west2-b respectively. Then, we get the IP addresses
    // A.A.A.A, A.A.A.A, B.B.B.B, B.B.B.B because we want the indices of the
    // IP addresses to correspond to the sorted subnets.
    const ipAddressesPerSubnetPerNode = ipAddressForEachSubnetForEachFullNode.map((ips: string[]) =>
      ips.join('\\\,')
    )

    return [
      `--set aws=true`,
      `--set storage.storageClass=gp2`,
      `--set geth.aws.all_subnet_cidr_blocks='{${subnetCIDRBlocks.join(',')}}'`,
      `--set geth.aws.eip_allocation_ids_per_public_subnet_per_node='{${allocationIdsPerPublicSubnetPerNodeParamStr}}'`,
      `--set geth.aws.ip_addresses_per_subnet_per_node='{${ipAddressesPerSubnetPerNode.join(',')}}'`,
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

    // for each full node, gives a mapping of (public) subnet ID -> allocation ID
    const allocationIDPerPublicSubnetForEachFullNode: Array<{
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
    return allocationIDPerPublicSubnetForEachFullNode
  }

  async getAllSubnetsSortedByAZ(): Promise<any> {
    const clusterName: string = this.deploymentConfig.clusterConfig.clusterName
    return getAllSubnetsSortedByAZ(clusterName)
  }

  /**
   * Deallocates all allocated elastic IP addresses for this full node deployment
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

  /**
   * Tags to indicate an elastic IP is a part of this deployment and to
   * easily differentiate it from other IPs in this deployment.
   */
  getElasticIPTags(subnetID: string, index: number) {
    return {
      ...this.genericElasticIPTags,
      Name: `${this.staticIPNamePrefix}-${index}-${subnetID}`,
      index: index.toString(10),
      subnetID,
    }
  }

  /**
   * Some tags to identify elastic IP addresses as a part of this deployment
   */
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
