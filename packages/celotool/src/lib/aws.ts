import { execCmd, execCmdAndParseJson } from './cmd-utils'
import { AwsClusterConfig } from './k8s-cluster/aws'

export async function getKeyArnFromAlias(alias: string, region: string) {
  const fullAliasName = `alias/${alias}`
  /**
   * Expected output example:
   * [
   *   {
   *     "AliasName": "alias/test-ecc-key",
   *     "AliasArn": "arn:aws:kms:eu-central-1:243983831780:alias/test-ecc-key",
   *     "TargetKeyId": "1d6db902-9a45-4dd5-bd1e-7250b2306f18"
   *   }
   * ]
   */
  const [parsed] = await execCmdAndParseJson(
    `aws kms list-aliases --region ${region} --query 'Aliases[?AliasName == \`${fullAliasName}\`]' --output json`
  )
  if (!parsed) {
    throw Error(`Could not find key with alias ${alias} and region ${region}`)
  }
  return parsed.AliasArn.replace(fullAliasName, `key/${parsed.TargetKeyId}`)
}

export function deleteRole(roleName: string) {
  return execCmd(`aws iam delete-role --role-name ${roleName}`)
}

export function detachPolicyIdempotent(roleName: string, policyArn: string) {
  return execCmd(`aws iam detach-role-policy --role-name ${roleName} --policy-arn ${policyArn}`)
}

/**
 * Deletes all policy versions and the policy itself
 */
export async function deletePolicy(policyArn: string) {
  // First, delete all non-default policy versions
  const policyVersions = await getPolicyVersions(policyArn)
  await Promise.all(
    policyVersions
      .filter((version: any) => !version.IsDefaultVersion) // cannot delete the default version
      .map((version: any) => deletePolicyVersion(policyArn, version.VersionId))
  )
  return execCmd(`aws iam delete-policy --policy-arn ${policyArn}`)
}

function deletePolicyVersion(policyArn: string, versionId: string) {
  return execCmd(
    `aws iam delete-policy-version --policy-arn ${policyArn} --version-id ${versionId}`
  )
}

async function getPolicyVersions(policyArn: string) {
  return execCmdAndParseJson(
    `aws iam list-policy-versions --policy-arn ${policyArn} --query 'Versions' --output json`
  )
}

export async function getPolicyArn(policyName: string) {
  const [policy] = await execCmdAndParseJson(
    `aws iam list-policies --query 'Policies[?PolicyName == \`${policyName}\`]' --output json`
  )
  if (!policy) {
    return undefined
  }
  return policy.Arn
}

/**
 * Given a cluster name, finds the NodeInstanceRole that's used by the nodes.
 * There's no easy way to query this directly, so this command searches through
 * roles and finds the correct one.
 */
export async function getEKSNodeInstanceGroupRoleArn(clusterName: string) {
  const existingRoles = await execCmdAndParseJson(
    `aws iam list-roles --query 'Roles' --output json`
  )
  const potentialRoles = existingRoles.filter((role: any) => {
    // The role name doesn't necessarily include the cluster name, but it will include
    // 'NodeInstanceRole'.
    const re = new RegExp(`.+-NodeInstanceRole-.+`)
    return re.test(role.RoleName)
  })
  let roleArn: string | undefined
  for (const role of potentialRoles) {
    const [clusterNameTag] = await execCmdAndParseJson(
      `aws iam list-role-tags --role-name ${role.RoleName} --query 'Tags[?Key == \`alpha.eksctl.io/cluster-name\`]'`
    )
    if (clusterNameTag && clusterNameTag.Value === clusterName) {
      roleArn = role.Arn
      break
    }
  }
  if (!roleArn) {
    throw Error(`Could not find NodeInstanceRole for cluster ${clusterName}`)
  }
  return roleArn
}

export function attachPolicyIdempotent(roleName: string, policyArn: string) {
  return execCmd(`aws iam attach-role-policy --role-name ${roleName} --policy-arn ${policyArn}`)
}

export async function createRoleIdempotent(roleName: string, policyDocumentJson: string) {
  const [existing] = await execCmdAndParseJson(
    `aws iam list-roles --query 'Roles[?RoleName == \`${roleName}\`]' --output json`
  )
  if (existing) {
    console.info(`Role ${roleName} exists`)
    return existing.Arn
  }
  console.info(`Creating role ${roleName}`)
  const [outputRaw] = await execCmd(
    `aws iam create-role --role-name ${roleName} --assume-role-policy-document '${policyDocumentJson}' --query 'Role.Arn' --output text`
  )
  return outputRaw.trim()
}

export async function createPolicyIdempotent(policyName: string, policyDocumentJson: string) {
  const [existing] = await execCmdAndParseJson(
    `aws iam list-policies --query 'Policies[?PolicyName == \`${policyName}\`]' --output json`
  )
  if (existing) {
    console.info(`Policy ${policyName} exists`)
    return existing.Arn
  }
  console.info(`Creating policy ${policyName}`)
  const [output] = await execCmd(
    `aws iam create-policy --policy-name ${policyName} --policy-document '${policyDocumentJson}' --query 'Policy.Arn' --output text`
  )
  return output.trim()
}

/**
 * A cluster will have a security group that applies to all nodes (ie VMs) in the cluster.
 * This returns a description of that security group.
 */
export function getClusterSharedNodeSecurityGroup(clusterConfig: AwsClusterConfig) {
  return execCmdAndParseJson(
    `aws ec2 describe-security-groups --filters "Name=tag:aws:cloudformation:logical-id,Values=ClusterSharedNodeSecurityGroup" "Name=tag:eksctl.cluster.k8s.io/v1alpha1/cluster-name,Values=${clusterConfig.clusterName}" --query "SecurityGroups[0]" --output json`
  )
}

/**
 * For a given security group, authorizes ingress traffic on a provided port
 * for a given protocol and CIDR range.
 */
export function authorizeSecurityGroupIngress(
  groupID: string,
  port: number,
  protocol: string,
  cidrRange: string
) {
  return execCmd(
    `aws ec2 authorize-security-group-ingress --group-id ${groupID} --ip-permissions IpProtocol=${protocol},FromPort=${port},ToPort=${port},IpRanges='[{CidrIp=${cidrRange}}]'`
  )
}

/**
 * For a given security group, revokes authorized ingress traffic on a provided port
 * for a given protocol and CIDR range.
 */
export function revokeSecurityGroupIngress(
  groupID: string,
  port: number,
  protocol: string,
  cidrRange: string
) {
  return execCmd(
    `aws ec2 revoke-security-group-ingress --group-id ${groupID} --ip-permissions IpProtocol=${protocol},FromPort=${port},ToPort=${port},IpRanges='[{CidrIp=${cidrRange}}]'`
  )
}
