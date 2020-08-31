import { AWSClusterConfig } from '../k8s-cluster/aws'
import { BaseFullNodeDeploymentConfig } from './base'
import { BaseNodePortFullNodeDeployer } from './base-nodeport'

export interface AWSFullNodeDeploymentConfig extends BaseFullNodeDeploymentConfig {
  clusterConfig: AWSClusterConfig
}

/**
 * At the moment, there is no way to use a Network Load Balancer on EKS
 * with ingress TCP & UDP traffic on the same port. Instead, we use NodePort
 * services.
 */
export class AWSFullNodeDeployer extends BaseNodePortFullNodeDeployer {
  /**
   * Gets AWS-specific helm parameters.
   */
  async additionalHelmParameters() {
    return [
      ...(await super.additionalHelmParameters()),
      `--set aws=true`,
      `--set storage.storageClass=gp2`,
    ]
  }

  /**
   * Prints action required to remove the node ports, and removes the chart
   */
  async removeChart() {
    const serviceForEachFullNode = await this.getServiceForEachFullNode()
    const serviceNodePortsSet = serviceForEachFullNode.reduce((set: Set<number>, service: any) => {
      // If there is no service for a full node, it is undefined. Just ignore
      if (!service) {
        return set
      }
      for (const portSpec of service.spec.ports) {
        if (portSpec.nodePort) {
          set.add(portSpec.nodePort)
        }
      }
      return set
    }, new Set<number>())
    this.printNodePortsActionRequired(Array.from(serviceNodePortsSet), true)
    await super.removeChart()
  }

  /**
   * In order for NodePort to work on an EKS cluster, you need to manually
   * allow ingress traffic to the specific ports for each VM in the cluster.
   * This prints a message showing which ports need to be added and how to modify
   * the security group that is common to all VMs in a cluster.
   */
  printNodePortsActionRequired(nodePorts: number[], destroy: boolean = false) {
    const CYAN = '\x1b[36m'
    const RESET = '\x1b[0m'
    const RED = '\x1b[31m'
    const YELLOW = '\x1b[33m'
    const defaultColor = CYAN
    const makeColor = (str: string, color: string, backToColor: string = defaultColor) => `${color}${str}${backToColor}`
    console.info(
      makeColor(
        `======\n` +
        `ACTION REQUIRED - don't ignore or things might break!\n` +
        `Make sure to modify the appropriate security group to ensure all nodes in the cluster` +
        `${destroy ? makeColor(' do not', RED) : ''} accept custom TCP & UDP traffic on only the following ports:\n` +
        `${makeColor(JSON.stringify(nodePorts), YELLOW)}\n` +
        `The security group can be found by navigating to a VM in the cluster on the ` +
        `AWS console, going to "Security", and finding the security group whose name ` +
        `includes "ClusterSharedNodeSecurityGroup".\n` +
        `Each port should${destroy ? makeColor(' not', RED) : '' } have a Custom UDP and Custom TCP inbound rule with source "0.0.0.0/0"\n` +
        `======`,
        CYAN,
        RESET
      )
    )
  }
}
