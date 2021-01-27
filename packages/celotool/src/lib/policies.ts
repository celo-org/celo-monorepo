import path from 'path'
import { execCmd } from './cmd-utils'
const yaml = require('js-yaml')
const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)

export function getPoliciesDir(celoEnv: string) {
  return path.resolve(process.cwd(), `.tmp/policies/${celoEnv}`)
}

export async function downloadPolicies(celoEnv: string) {
  const [output] = await execCmd('gcloud alpha monitoring policies list')
  const policies: any[] = yaml.safeLoadAll(output)
  const envPolicies: any[] = []
  for (const policy of policies) {
    if (!policy.displayName.endsWith(celoEnv)) {
      continue
    }
    envPolicies.push(policy)
  }
  return envPolicies
}

export async function getMatchingPolicyNameIfExists(displayName: string) {
  const [output] = await execCmd('gcloud alpha monitoring policies list')
  const existingPolicies: any[] = yaml.safeLoadAll(output)
  const existingPolicyNames: string[] = existingPolicies.map((policy) => policy.displayName)
  if (existingPolicyNames.includes(displayName)) {
    return existingPolicies[existingPolicyNames.indexOf(displayName)].name
  } else {
    return null
  }
}

export async function uploadPolicies(celoEnv: string, policies: any[], dryRun: boolean) {
  const policiesDir = getPoliciesDir(celoEnv)
  if (!fs.existsSync(policiesDir)) {
    await execCmd(`mkdir -p ${policiesDir}`)
  }
  for (const policy of policies) {
    const policyString = JSON.stringify(policy, null, 2)
    const policyFilePath = path.resolve(
      policiesDir,
      `${policy.displayName.replace(/[\/\ ]/g, '-')}.json`
    )
    try {
      await writeFile(policyFilePath, policyString)

      if (!dryRun) {
        const matchingPolicyName = await getMatchingPolicyNameIfExists(policy.displayName)
        if (matchingPolicyName) {
          await execCmd(
            `gcloud alpha monitoring policies update ${matchingPolicyName} --policy-from-file=${policyFilePath}`
          )
        } else {
          await execCmd(
            `gcloud alpha monitoring policies create --policy-from-file=${policyFilePath}`
          )
        }
      }
    } catch (error) {
      console.error(`Unable to update/create policy at ${policyFilePath}:\n${error}`)
    }
  }
}

export async function deleteOtherPolicies(celoEnv: string, keepPolicies: any[]) {
  const keepPolicyNames: string[] = keepPolicies.map((policy) => policy.displayName)
  const policies = await downloadPolicies(celoEnv)
  await Promise.all(
    policies.map(async (policy: any) => {
      if (!keepPolicyNames.includes(policy.displayName)) {
        await execCmd(`echo y | gcloud alpha monitoring policies delete ${policy.name}`)
      }
    })
  )
}
