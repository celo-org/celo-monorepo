import sleep from 'sleep-promise'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'

export interface AWSResourceTags { [key: string]: string }

/**
 * Registers an elastic IP address with the given tags if one does not already exist.
 * @return the allocation id of the IP address.
 */
export async function getOrRegisterElasticIP(tags: AWSResourceTags) {
  const existingAllocIds = await describeElasticIPAddresses(tags, { query: 'Addresses[*].AllocationId' })
  if (existingAllocIds.length) {
    console.info(`Skipping IP address registration, address with tags ${JSON.stringify(tags)} exists`)
    // We expect only 1 matching IP
    return existingAllocIds[0]
  }

  console.info(`Registering IP address with tags ${JSON.stringify(tags)}`)
  // Allocate address on AWS and get the allocationID
  const [allocationIDUntrimmed] = await execCmdWithExitOnFailure(
    `aws ec2 allocate-address --query '[AllocationId]' --output text`
  )
  const allocationID = allocationIDUntrimmed.trim()

  const tagStrings = Object.entries(tags).map(([key, value]) =>
    `Key=${key},Value=${value}`
  )

  // Add tags to allocationID
  await execCmdWithExitOnFailure(
    `aws ec2 create-tags --resources ${allocationID} --tags ${tagStrings.join(' ')}`
  )

  return allocationID
}

/**
 * @param allocationIDs array of elastic IP allocation IDs
 * @return array of IP addresses corresponding to input allocationIDs
 */
export function getElasticIPAddressesFromAllocationIDs(allocationIDs: string[]) {
  return Promise.all(
    allocationIDs.map(getElasticIPAddressFromAllocationID)
  )
}

/**
 * @param allocationID an elastic IP allocation ID
 * @return the IP address of the elastic IP
 */
function getElasticIPAddressFromAllocationID(allocationID: string) {
  return describeElasticIPAddresses({}, {
    'allocation-ids': allocationID,
    query: 'Addresses[0].PublicIp'
  })
}

/**
 * Deallocates a specific elastic IP
 * @param allocationID an elastic IP allocation ID
 */
export async function deallocateAWSStaticIP(allocationID: string) {
  console.info(`Deallocating IP address with allocationID ${allocationID}`)
  return execCmdWithExitOnFailure(
    `aws ec2 release-address --allocation-id ${allocationID}`
  )
}

/**
 * An elastic IP will have an association ID if it is associated with a resource
 * (like a load balancer). An elastic IP will fail to be removed if it is still
 * associated with a resource. This waits until an elastic IP with the given
 * tags does not have an association ID. This function does not do anything to
 * actually remove the association.
 */
export async function waitForElasticIPAssociationIDRemoval(allocationID: string) {
  const maxTryCount = 15
  const tryIntervalMs = 3000
  for (let tryCount = 0; tryCount < maxTryCount; tryCount++) {
    const associationID = await describeElasticIPAddresses({}, {
      'allocation-ids': allocationID,
      query: 'Addresses[0].AssociationId'
    })
    if (!associationID) {
      return
    }
    await sleep(tryIntervalMs)
  }
  throw Error(`Too many tries waiting for elastic IP association ID removal`)
}

/**
 * Runs the `aws ec2 describe-addresses` command given tags or custom command line flags
 * @param tags tags to filter for
 * @param cmdFlags optional command line flags to run the command with
 */
export async function describeElasticIPAddresses(tags: AWSResourceTags, cmdFlags?: { [key: string]: string }) {
  const filters = Object.entries(tags).map(([key, value]) =>
    `"Name=tag:${key},Values=${value}"`
  )
  const flags = cmdFlags ? Object.entries(cmdFlags).map(([flag, value]) =>
    `--${flag} '${value}'`
  ) : []
  // This fetches the IP allocation ID that have the corresponding tag values of resourceGroup and name
  const [response] = await execCmdWithExitOnFailure(
    `aws ec2 describe-addresses ${
      filters.length ? `--filters ${filters.join(' ')}` : ''
    } ${flags.join(' ')} --output json`
  )
  return JSON.parse(response)
}

/**
 * The AWS CLI gives tags in the form [{ "Key": "theKey", "Value": "theValue" }],
 * this function we converts those into an object { "theKey": "theValue" }
 * @param tagsArray an array of the form `[{ "Key": "theKey", "Value": "theValue" }, ...]`
 * @return the corresponding AWSResourceTags object
 */
export function tagsArrayToAWSResourceTags(tagsArray: Array<{ [key: string]: string }>): AWSResourceTags {
  const tags: AWSResourceTags = {}
  for (const tag of tagsArray) {
    if (tag.hasOwnProperty('Key') && tag.hasOwnProperty('Value')) {
      tags[tag.Key] = tag.Value
    }
  }
  return tags
}

export async function getAllSubnetsSortedByAZ(clusterName: string): Promise<any> {
  const [subnetsStr] = await execCmdWithExitOnFailure(
    `aws ec2 describe-subnets --filters "Name=tag-key,Values=kubernetes.io/cluster/${clusterName}" --query "Subnets" --output json`
  )
  const subnets = JSON.parse(subnetsStr)
  return subnets.sort((a: any, b: any) =>
    b.AvailabilityZone < a.AvailabilityZone ? 1 : -1
  )
}

/**
 * Given subnet information (likely given from teh AWS CLI), determines
 * if the subnet is publicly facing.
 */
export function subnetIsPublic(subnet: any): boolean {
  const tags = tagsArrayToAWSResourceTags(subnet.Tags)
  // If the subnet is public, it will have a tag of this name
  return tags.hasOwnProperty('kubernetes.io/role/elb')
}
