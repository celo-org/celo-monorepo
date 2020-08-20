import { ClusterConfig } from 'src/lib/cloud-provider'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'

/**
 * Basic info for an EKS cluster
 */
export interface AwsClusterConfig extends ClusterConfig {
  clusterRegion: string,
  resourceGroupTag: string
}

// IP ADDRESS RELATED
// IP addresses in AWS will have the following tags:
// tag=resourceGroupTag Value=DynamicEnvVar.ORACLE_RESOURCE_GROUP_TAG
// tag=IPNodeName Value=`${getStaticIPNamePrefix(celoEnv)}-${i}`

export async function getOrRegisterStaticIP(tags: { [key: string]: string }) {
  // This returns an array of matching Allocation Ids for IP addresses. If there is no matching IP
  // address, an empty array is returned. We expect at most 1 matching Allocation ID

  // const filters = Object.entries(tags).map(([key, value]) =>
  //   `"Name=tag:${key},Values=${value}"`
  // )
  const existingAllocIds = await describeElasticIPAddresses(tags, 'Addresses[*].AllocationId')

  // // This fetches the IP allocation ID that have the corresponding tag values of resourceGroup and name
  // const [existingAllocIdsStr] = await execCmdWithExitOnFailure(
  //   `aws ec2 describe-addresses --filters ${filters.join(' ')} --query 'Addresses[*].[AllocationId]' --output json`
  // )
  // const existingAllocIds = JSON.parse(existingAllocIdsStr)
  if (existingAllocIds.length) {
    console.info(`Skipping IP address registration, address with tags ${JSON.stringify(tags)} exists`)
    // We expect only 1 matching IP
    return existingAllocIds[0]
  }
  console.info(`Registering IP address with tags ${JSON.stringify(tags)}`)

  // Allocate address on AWS and store allocationID
  const [allocationID] = await execCmdWithExitOnFailure(
    `aws ec2 allocate-address --query '[AllocationId]' --output text`
  )

  const tagStrings = Object.entries(tags).map(([key, value]) =>
    `Key=${key},Value=${value}`
  )

  // Add tags to allocationID
  await execCmdWithExitOnFailure(
    `aws ec2 create-tags --resources ${allocationID.trim()} --tags ${tagStrings.join(' ')}`
  )

  // `aws ec2 create-tags --resources ${allocationID.trim()} --tags Key=resourceGroupTag,Value=${resourceGroup} Key=IPNodeName,Value=${name}`
  // Fetch Address of newly created
  // const [address] = await execCmdWithExitOnFailure(
  //   `aws ec2 describe-addresses --filters "Name=tag:resourceGroupTag,Values=${resourceGroup}" "Name=tag:IPNodeName,Values=${name}" --query 'Addresses[*].[PublicIp]' --output json`
  // )

  // return address.trim()
  return allocationID.trim()
}

export async function describeElasticIPAddresses(tags: { [key: string]: string }, query?: string) {
  const filters = Object.entries(tags).map(([key, value]) =>
    `"Name=tag:${key},Values=${value}"`
  )
  console.log(`aws ec2 describe-addresses --filters ${filters.join(' ')} ${query ? `--query '${query}'` : ''} --output json`)
  // This fetches the IP allocation ID that have the corresponding tag values of resourceGroup and name
  const [response] = await execCmdWithExitOnFailure(
    `aws ec2 describe-addresses --filters ${filters.join(' ')} ${query ? `--query '${query}'` : ''} --output json`
  )
  return JSON.parse(response)
}

export async function deallocateAWSStaticIP(tags: { [key: string]: string }) {
  console.info(`Deallocating IP address with tags ${tags}`)
  const [allocationID] = await describeElasticIPAddresses(tags, 'Addresses[*].AllocationId')
  console.log('allocationID', allocationID)
  if (!allocationID) {
    throw Error(`Could not find allocationID for tags ${tags}`)
  }

  // const [allocationID] = await execCmdWithExitOnFailure(
  //   `aws ec2 describe-addresses --filters "Name=tag:resourceGroupTag,Values=${resourceGroup}" "Name=tag:IPNodeName,Values=${name}" --query 'Addresses[*].[AllocationId]' --output text`
  // )
  return execCmdWithExitOnFailure(
    `aws ec2 release-address --allocation-id ${allocationID.trim()}`
  )
}
