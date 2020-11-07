import { execCmd } from './cmd-utils'
import { AWSClusterConfig } from './k8s-cluster/aws'

/**
 * A cluster will have a security group that applies to all nodes (ie VMs) in the cluster.
 * This returns a description of that security group.
 */
export async function getClusterSharedNodeSecurityGroup(clusterConfig: AWSClusterConfig) {
  const [output] = await execCmd(
    `aws ec2 describe-security-groups --filters "Name=tag:aws:cloudformation:logical-id,Values=ClusterSharedNodeSecurityGroup" "Name=tag:eksctl.cluster.k8s.io/v1alpha1/cluster-name,Values=${clusterConfig.clusterName}" --query "SecurityGroups[0]" --output json`
  )
  return JSON.parse(output)
}

/**
 * For a given security group, authorizes ingress traffic on a provided port
 * for a given protocol and CIDR range.
 */
export async function authorizeSecurityGroupIngress(groupID: string, port: number, protocol: string, cidrRange: string) {
  return execCmd(
    `aws ec2 authorize-security-group-ingress --group-id ${groupID} --ip-permissions IpProtocol=${protocol},FromPort=${port},ToPort=${port},IpRanges='[{CidrIp=${cidrRange}}]'`
  )
}

/**
 * For a given security group, revokes authorized ingress traffic on a provided port
 * for a given protocol and CIDR range.
 */
export async function revokeSecurityGroupIngress(groupID: string, port: number, protocol: string, cidrRange: string) {
  return execCmd(
    `aws ec2 revoke-security-group-ingress --group-id ${groupID} --ip-permissions IpProtocol=${protocol},FromPort=${port},ToPort=${port},IpRanges='[{CidrIp=${cidrRange}}]'`
  )
}
