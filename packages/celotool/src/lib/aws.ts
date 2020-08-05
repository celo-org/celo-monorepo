import { ClusterConfig, setContextAndCheckForMissingCredentials, setupCloudCluster } from 'src/lib/cloud-provider'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'

/**
 * Basic info for an EKS cluster
 */
export interface AwsClusterConfig extends ClusterConfig {
  clusterRegion: string,
  resourceGroupTag: string
}

// switchToAwsCluster configures kubectl to connect to the EKS cluster
export async function switchToAwsCluster(
  celoEnv: string,
  clusterConfig: AwsClusterConfig,
) {

  // TODO Look into switching subscription between testing and production
  console.info(clusterConfig.resourceGroupTag)
  const isContextSetCorrectly = await setContextAndCheckForMissingCredentials(clusterConfig)
  if (!isContextSetCorrectly) {
    // If context does not exist, fetch it.
    await execCmdWithExitOnFailure(
      `aws eks --region ${clusterConfig.clusterRegion} update-kubeconfig --name ${clusterConfig.clusterName} --alias ${clusterConfig.clusterName}`
      ) 
  }

  await setupCluster(celoEnv, clusterConfig)
}

// setupCluster is idempotent-- it will only make changes that have not been made
// before. Therefore, it's safe to be called for a cluster that's been fully set up before
async function setupCluster(celoEnv: string, clusterConfig: AwsClusterConfig) {
  await setupCloudCluster(celoEnv, clusterConfig)
  // TODO Find a substitute for AADPodIdentity on AWS
}

// IP ADDRESS RELATED
// IP addresses in AWS will have the following tags:
// tag=resourceGroupTag Value=DynamicEnvVar.ORACLE_RESOURCE_GROUP_TAG
// tag=IPNodeName Value=`${getStaticIPNamePrefix(celoEnv)}-${i}`

export async function registerAWSStaticIPIfNotRegistered(name: string, resourceGroup: string) {
  // This returns an array of matching Allocation Ids for IP addresses. If there is no matching IP
  // address, an empty array is returned. We expect at most 1 matching Allocation ID

  // This fetches the IP allocation ID that have the corresponding tag values of resourceGroup and name
  const [existingAllocIdsStr] = await execCmdWithExitOnFailure(
    `aws ec2 describe-addresses --filters "Name=tag:resourceGroupTag,Values=${resourceGroup}" "Name=tag:IPNodeName,Values=${name}" --query 'Addresses[*].[AllocationId]' --output json`
  )
  const existingAllocIds = JSON.parse(existingAllocIdsStr)
  if (existingAllocIds.length) {
    console.info(`Skipping IP address registration, ${name} on ${resourceGroup} exists`)
    // We expect only 1 matching IP
    return existingAllocIds[0]
  }
  console.info(`Registering IP address on AWS with tags where IPNodeName is ${name} and resourceGroupTag is ${resourceGroup}`)

  // Allocate address on AWS and store allocationID
  const [allocationID] = await execCmdWithExitOnFailure(
    `aws ec2 allocate-address --query '[AllocationId]' --output text`
  )

  // Add tags to allocationID
  await execCmdWithExitOnFailure(
    `aws ec2 create-tags --resources ${allocationID.trim()} --tags Key=resourceGroupTag,Value=${resourceGroup} Key=IPNodeName,Value=${name}` 
  )

  // Fetch Address of newly created
  // const [address] = await execCmdWithExitOnFailure(
  //   `aws ec2 describe-addresses --filters "Name=tag:resourceGroupTag,Values=${resourceGroup}" "Name=tag:IPNodeName,Values=${name}" --query 'Addresses[*].[PublicIp]' --output json`
  // )

  // return address.trim()
  return allocationID.trim()
}

export async function deallocateAWSStaticIP(name: string, resourceGroup: string) {
  console.info(`Deallocating IP address ${name} on ${resourceGroup}`)
  const [allocationID] = await execCmdWithExitOnFailure(
    `aws ec2 describe-addresses --filters "Name=tag:resourceGroupTag,Values=${resourceGroup}" "Name=tag:IPNodeName,Values=${name}" --query 'Addresses[*].[AllocationId]' --output text`
  )
  return execCmdWithExitOnFailure(
    `aws ec2 release-address --allocation-id ${allocationID.trim()}`
  )
}
