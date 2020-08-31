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

  async removeChart() {
    const serviceForEachFullNode = await this.getServiceForEachFullNode()
    const serviceNodePortsSet = serviceForEachFullNode.reduce((set: Set<number>, service: any) => {
      for (const port of service.spec.ports) {
        set.add(port)
      }
      return set
    }, new Set<number>())
    this.printNodePortsToAllow(Array.from(serviceNodePortsSet), true)
    await super.removeChart()
  }

  printNodePortsToAllow(nodePorts: number[], destroy: boolean = false) {
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
    console.info('test')
  }
}
