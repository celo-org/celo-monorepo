import { authorizeSecurityGroupIngress, getClusterSharedNodeSecurityGroup, revokeSecurityGroupIngress } from '../aws'
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
    const nodePortSet = await this.getExistingNodePortSet()
    await this.setIngressRulesTCPAndUDP(Array.from(nodePortSet), false)
    // this.printNodePortsActionRequired(Array.from(serviceNodePortsSet), true)
    await super.removeChart()
  }

  async setIngressRulesTCPAndUDP(ports: number[], authorize: boolean) {
    const cidrRange = '0.0.0.0/0'
    const securityGroup = await getClusterSharedNodeSecurityGroup(this.deploymentConfig.clusterConfig)
    enum Protocols {
      tcp = 'tcp',
      udp = 'udp'
    }
    const existingRulesByPort: {
      [port: number]: {
        [protocol in Protocols]: boolean
      }
    } = {}
    console.log('securityGroup', securityGroup)
    for (const rule of securityGroup.IpPermissions) {
      // We assume that all rules that have been created by previous full node
      // deployments are for a single port, and not port ranges.
      // Ignore rules that do not apply to node port ranges or do not have the
      // desired cidr range
      if (
        rule.FromPort !== rule.ToPort ||
        !this.isNodePort(rule.FromPort) ||
        !rule.IpRanges.find((rangeSpec: any) => rangeSpec.CidrIp === cidrRange)
      ) {
        continue
      }
      const port = rule.FromPort
      existingRulesByPort[port] = Object.values(Protocols).reduce((obj: any, protocol: Protocols) => ({
        ...obj,
        [protocol]: obj[protocol] || rule.IpProtocol === protocol
      }), existingRulesByPort[port] || {})
      // const tcp = existingRulesByPort[port]?.tcp || rule.IpProtocol === 'tcp'
      // const udp = existingRulesByPort[port]?.udp || rule.IpProtocol === 'udp'
      // existingRulesByPort[port] = {
      //   tcp,
      //   udp
      // }
    }
    console.log('existingRulesByPort', existingRulesByPort)
    console.log('ports', ports)
    // const protocols = ['tcp', 'udp']
    for (const port of ports) {
      for (const protocol of Object.values(Protocols)) {
        const infoStr = `${protocol}/${port}`
        if (existingRulesByPort[port] && existingRulesByPort[port][protocol]) {
          if (authorize) {
            console.info(`Already authorized ${infoStr}`)
          } else {
            console.info(`Revoking ${infoStr} authorization`)
            await revokeSecurityGroupIngress(securityGroup.GroupId, port, protocol, cidrRange)
          }
          continue
        } else if (authorize) {
          console.info(`Authorizing ${infoStr}`)
          await authorizeSecurityGroupIngress(securityGroup.GroupId, port, protocol, cidrRange)
        }
      }
    }
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

  get deploymentConfig(): AWSFullNodeDeploymentConfig {
    return this._deploymentConfig as AWSFullNodeDeploymentConfig
  }
}
