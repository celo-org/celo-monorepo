import fs from 'fs'
import { execCmd, execCmdAndParseJson } from './cmd-utils'

/**
 * Gets and parses the JSON IAM policy for the particular resource path
 * Example resource path: gs://celo-chain-backup/baklava/chaindata-latest.tar.gz
 */
export async function getIamPolicyForBucketOrObject(resourcePath: string) {
  return execCmdAndParseJson(
    `gsutil iam get ${resourcePath}`
  )
}

/**
 * Sets the IAM policy for the resource at resourcePath to the policyJson object.
 * Example resource path: gs://celo-chain-backup/baklava/chaindata-latest.tar.gz
 */
export async function setIamPolicyForBucketOrObject(resourcePath: string, policyJson: any) {
  const filePath = `/tmp/iamPolicyForBucketOrObject.json`
  fs.writeFileSync(filePath, JSON.stringify(policyJson))
  return execCmd(
    `gsutil iam set ${filePath} ${resourcePath}`
  )
}

/**
 * Grants `member` the IAM role `role` for the resource at `resourcePath`
 */
export async function grantIamRoleForBucketOrObjectIdempotent(resourcePath: string, member: string, role: string) {
  const policy = await getIamPolicyForBucketOrObject(resourcePath)
  const existingBinding = policy.bindings.find((binding: any) => binding.role === role)
  if (existingBinding) {
    // If the binding for the role already includes the member, no action needed
    if (existingBinding.members.includes(member)) {
      return
    }
    existingBinding.members.push(member)
  } else {
    // If there isn't already a binding for the role, create one 
    policy.bindings.push({
      members: [member],
      role
    })
  }
  return setIamPolicyForBucketOrObject(resourcePath, policy)
}

export async function revokeIamRoleForBucketOrObjectIdempotent(resourcePath: string, member: string, role: string) {
  const policy = await getIamPolicyForBucketOrObject(resourcePath)
  const bindingIndex = policy.bindings.indexOf((binding: any) => binding.role === role)
  // If there are no bindings for the role, no action is needed
  if (bindingIndex < 0) {
    return
  }
  const existingBinding = policy.bindings[bindingIndex]
  if (existingBinding) {
    const memberIndex = existingBinding.members.indexOf(member)
    // If the member doesn't have that role, no action is needed
    if (memberIndex < 0) {
      return
    }
    existingBinding.members.splice(memberIndex, 1)
    // If we just removed the only member of the binding, remove the whole binding
    if (!existingBinding.members.length) {
      policy.bindings.splice(bindingIndex, 1)
    }
  }
  return setIamPolicyForBucketOrObject(resourcePath, policy)
}
