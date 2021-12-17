import {
  authorizeSecurityGroupIngress,
  getClusterSharedNodeSecurityGroup,
  revokeSecurityGroupIngress,
} from '../aws'
import { AwsClusterConfig } from '../k8s-cluster/aws'
import { BaseFullNodeDeploymentConfig } from './base'
import { BaseNodePortFullNodeDeployer } from './base-nodeport'

export interface AwsFullNodeDeploymentConfig extends BaseFullNodeDeploymentConfig {
  clusterConfig: AwsClusterConfig
}

enum Protocols {
  tcp = 'tcp',
  udp = 'udp',
}

/**
 * At the moment, there is no way to use a Network Load Balancer on EKS
 * with ingress TCP & UDP traffic on the same port. Instead, we use NodePort
 * services.
 */
export class AwsFullNodeDeployer extends BaseNodePortFullNodeDeployer {
  /**
   * Gets AWS-specific helm parameters.
   */
  async additionalHelmParameters() {
    return [
      ...(await super.additionalHelmParameters()),
      `--set aws=true`,
      `--set storage.storageClass=gp2`,
      // A single element because we will be using tcp and udp on a single service
      `--set geth.service_protocols='{tcp-and-udp}'`,
    ]
  }

  /**
   * Prints action required to remove the node ports, and removes the chart
   */
  async removeChart() {
    const nodePortSet = await this.getExistingNodePortSet()
    await this.setIngressRulesTCPAndUDP(Array.from(nodePortSet), false)
    await super.removeChart()
  }

  /**
   * When authorize is true, will ensure that the cluster's shared security group
   * allows ingress tcp & udp traffic from 0.0.0.0/0 for the specified ports.
   * When authorize is false, removes any of the roles corresponding to the ports
   * as just described.
   */
  async setIngressRulesTCPAndUDP(ports: number[], authorize: boolean) {
    const cidrRange = '0.0.0.0/0'
    const securityGroup = await getClusterSharedNodeSecurityGroup(
      this.deploymentConfig.clusterConfig
    )

    // Record the existing relevant rules on the security group. We want to know
    // if both udp and tcp ingress traffic has been enabled for the ports.
    const existingRulesByPort: {
      [port: number]: {
        [protocol in Protocols]: boolean
      }
    } = {}
    for (const rule of securityGroup.IpPermissions) {
      // We assume that all rules that have been created by previous full node
      // deployments are for a single port, and not port ranges.
      // Don't consider rules that do not apply to node port ranges or do not have the
      // desired cidr range.
      if (
        rule.FromPort !== rule.ToPort ||
        !this.isNodePort(rule.FromPort) ||
        !rule.IpRanges.find((rangeSpec: any) => rangeSpec.CidrIp === cidrRange)
      ) {
        continue
      }
      const port = rule.FromPort
      existingRulesByPort[port] = Object.values(Protocols).reduce(
        (obj: any, protocol: Protocols) => ({
          ...obj,
          [protocol]: obj[protocol] || rule.IpProtocol === protocol,
        }),
        existingRulesByPort[port] || {}
      )
    }

    // Iterate over all the provided ports and protocols, and either authorize
    // or revoke ingress permission.
    for (const port of ports) {
      for (const protocol of Object.values(Protocols)) {
        const infoStr = `${port}/${protocol}`
        // If the rule already exists, either skip or revoke
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

  get deploymentConfig(): AwsFullNodeDeploymentConfig {
    return this._deploymentConfig as AwsFullNodeDeploymentConfig
  }
}
