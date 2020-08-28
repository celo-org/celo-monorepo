import { range } from 'lodash'
import { deallocateAWSStaticIP, describeElasticIPAddresses, getAllSubnetsSortedByAZ, getOrRegisterElasticIP, subnetIsPublic, tagsArrayToAWSResourceTags, waitForElasticIPAssociationIDRemoval } from '../aws'
import { AWSClusterConfig } from '../k8s-cluster/aws'
import { deleteResource, getAllUsedNodePorts, getService } from '../kubernetes'
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
    const replicas = this._deploymentConfig.replicas
    const allUsedNodePorts = await getAllUsedNodePorts()
    const serviceForEachFullNode = await Promise.all(
      range(replicas).map(async (i: number) =>
        getService(`${this.celoEnv}-fullnodes-${i}`, this.kubeNamespace)
      )
    )

    const NO_KNOWN_NODE_PORT = -1
    const nodePortForEachFullNode: number[] = serviceForEachFullNode.map((service: any) => {
      if (!service) {
        return NO_KNOWN_NODE_PORT
      }
      return service.spec.ports.reduce((existingNodePort: number, portsSpec: any) => {
        if (!portsSpec.nodePort) {
          return existingNodePort
        }
        if (existingNodePort !== NO_KNOWN_NODE_PORT && existingNodePort !== portsSpec.nodePort) {
          throw Error(`Expected all nodePorts to be the same in service, got ${existingNodePort} !== ${portsSpec.nodePort}`)
        }
        return portsSpec.nodePort
      }, NO_KNOWN_NODE_PORT)
    })


    console.log('nodePortForEachFullNode b4', nodePortForEachFullNode)
    console.log('allUsedNodePorts b4', allUsedNodePorts)

    const minPort = 30000
    const maxPort = 32767
    let potentialPort = minPort
    let allUsedNodePortsIndex = 0
    for (let i = 0; i < nodePortForEachFullNode.length; i++) {
      const nodePort = nodePortForEachFullNode[i]
      if (nodePort === NO_KNOWN_NODE_PORT) {
        for (; allUsedNodePortsIndex < allUsedNodePorts.length; allUsedNodePortsIndex++) {
          if (potentialPort > maxPort) {
            throw Error(`No available node ports`)
          }
          const usedPort = allUsedNodePorts[allUsedNodePortsIndex]
          if (potentialPort < usedPort) {
            break
          }
          // Try the next port on the next iteration
          potentialPort = usedPort + 1
        }
        // Assign the port
        nodePortForEachFullNode[i] = potentialPort
        // Add the newly assigned port to allUsedNodePorts
        allUsedNodePorts.splice(allUsedNodePortsIndex, 0, potentialPort)
        // Increment potential port for a potential subsequent NodePort assignment
        potentialPort++
      }
    }

    console.log('nodePortForEachFullNode aft3r', nodePortForEachFullNode)
    console.log('allUsedNodePorts after', allUsedNodePorts)

    const nodePortPerFullNodeStrs = nodePortForEachFullNode.map((nodePort: number, index: number) =>
      `--set geth.service_node_port_per_full_node[${index}]=${nodePort}`
    )
    console.log('nodePortPerFullNodeStrs', nodePortPerFullNodeStrs)

    return [
      ...nodePortPerFullNodeStrs,
      `--set aws=true`,
      `--set storage.storageClass=gp2`,
      // At the moment we cannot use LoadBalancer for TCP & UDP ingress traffic
      // with same IP on a Network Load Balancer :(
      `--set geth.service_type=NodePort`,
      // `--set geth.aws.all_subnet_cidr_blocks='{${subnetCIDRBlocks.join(',')}}'`,
      // `--set geth.aws.eip_allocation_ids_per_public_subnet_per_node='{${allocationIdsPerPublicSubnetPerNodeParamStr}}'`,
      // `--set geth.aws.ip_addresses_per_subnet_per_node='{${ipAddressesPerSubnetPerNode.join(',')}}'`,
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
