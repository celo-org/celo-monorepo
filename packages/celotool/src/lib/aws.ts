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
  return execCmd(
    `aws iam delete-role --role-name ${roleName}`
  )
}

export function detachPolicyIdempotent(roleName: string, policyArn: string) {
  return execCmd(
    `aws iam detach-role-policy --role-name ${roleName} --policy-arn ${policyArn}`
  )
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
  return execCmd(
    `aws iam delete-policy --policy-arn ${policyArn}`
  )
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
 * Given a cluster name, finds the RoleArn that's used by the worker nodes.
 * Note this only supports EKS clusters with a single autoscaling group.
 */
export async function getEKSWorkerInstanceRoleArn(clusterName: string) {
  const launchConfigurations = await execCmdAndParseJson(
    `aws autoscaling describe-launch-configurations --query LaunchConfigurations --output json`
  )
  const launchConfigRegex = new RegExp(`${clusterName}.+`)
  const launchConfigMatch = launchConfigurations.find((launchConfig: any) => {
    return launchConfigRegex.test(launchConfig.LaunchConfigurationName)
  })
  if (!launchConfigMatch) {
    throw Error(`Could not find launch configuration for cluster ${clusterName}`)
  }
  return execCmdAndParseJson(
    `aws iam get-instance-profile --instance-profile-name ${launchConfigMatch.IamInstanceProfile} --query InstanceProfile.Roles[0].Arn --output json`
  )
}

export function attachPolicyIdempotent(roleName: string, policyArn: string) {
  return execCmd(
    `aws iam attach-role-policy --role-name ${roleName} --policy-arn ${policyArn}`
  )
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
 * A cluster will have a security group that applies to all worker nodes (ie VMs)
 * in the cluster. This returns a description of that security group.
 * Note this only supports single autoscale group clusters.
 */
export function getEKSWorkerSecurityGroup(clusterConfig: AwsClusterConfig) {
  return execCmdAndParseJson(
    `aws ec2 describe-security-groups --filter "Name=tag:Name,Values=${clusterConfig.clusterName}-eks_worker_sg" --query "SecurityGroups[0]" --output json`
  )
}

/**
 * For a given security group, authorizes ingress traffic on a provided port
 * for a given protocol and CIDR range.
 */
export function authorizeSecurityGroupIngress(groupID: string, port: number, protocol: string, cidrRange: string) {
  return execCmd(
    `aws ec2 authorize-security-group-ingress --group-id ${groupID} --ip-permissions IpProtocol=${protocol},FromPort=${port},ToPort=${port},IpRanges='[{CidrIp=${cidrRange}}]'`
  )
}

/**
 * For a given security group, revokes authorized ingress traffic on a provided port
 * for a given protocol and CIDR range.
 */
export function revokeSecurityGroupIngress(groupID: string, port: number, protocol: string, cidrRange: string) {
  return execCmd(
    `aws ec2 revoke-security-group-ingress --group-id ${groupID} --ip-permissions IpProtocol=${protocol},FromPort=${port},ToPort=${port},IpRanges='[{CidrIp=${cidrRange}}]'`
  )
}
