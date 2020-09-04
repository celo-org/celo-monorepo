import { execCmd } from './cmd-utils'
import { AWSClusterConfig } from './k8s-cluster/aws'

export async function getClusterSharedNodeSecurityGroup(clusterConfig: AWSClusterConfig) {
  // aws ec2 describe-security-groups --filters "Name=tag:aws:cloudformation:logical-id,Values=ClusterSharedNodeSecurityGroup" "Name=tag:eksctl.cluster.k8s.io/v1alpha1/cluster-name,Values=adorable-monster-1597251246"
  const [output] = await execCmd(
    `aws ec2 describe-security-groups --filters "Name=tag:aws:cloudformation:logical-id,Values=ClusterSharedNodeSecurityGroup" "Name=tag:eksctl.cluster.k8s.io/v1alpha1/cluster-name,Values=${clusterConfig.clusterName}" --query "SecurityGroups[0]" --output json`
  )
  return JSON.parse(output)
  // return
}
// authorize-security-group-ingress
export async function authorizeSecurityGroupIngress(groupID: string, port: number, protocol: string, cidrRange: string) {
  return execCmd(
    `aws ec2 authorize-security-group-ingress --group-id ${groupID} --ip-permissions IpProtocol=${protocol},FromPort=${port},ToPort=${port},IpRanges='[{CidrIp=${cidrRange}}]'`
  )
}

export async function revokeSecurityGroupIngress(groupID: string, port: number, protocol: string, cidrRange: string) {
  return execCmd(
    `aws ec2 revoke-security-group-ingress --group-id ${groupID} --ip-permissions IpProtocol=${protocol},FromPort=${port},ToPort=${port},IpRanges='[{CidrIp=${cidrRange}}]'`
  )
}
//
// function getClusterVpcID() {
//   // aws eks describe-cluster --name adorable-monster-1597251246 --query "cluster.resourcesVpcConfig.vpcId"
// }
