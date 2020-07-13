import { createNamespaceIfNotExists } from 'src/lib/cluster'
import { execCmd, execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { doCheckOrPromptIfStagingOrProduction } from 'src/lib/env-utils'
import { installAndEnableMetricsDeps, redeployTiller } from 'src/lib/helm_deploy'

/**
 * Basic info for an EKS cluster
 */
export interface AwsClusterConfig {
  clusterRegion: string
  clusterName: string 
  resourceGroupTag: string
  // tag: string
  // subscriptionId: string
}

// switchToAwsCluster configures kubectl to connect to the EKS cluster
export async function switchToAwsCluster(
  celoEnv: string,
  clusterConfig: AwsClusterConfig,
  checkOrPromptIfStagingOrProduction = true
) {
  if (checkOrPromptIfStagingOrProduction) {
    await doCheckOrPromptIfStagingOrProduction()
  }

  // TODO Look into switching subscription between testing and production

  let currentCluster = null
  try {
    ;[currentCluster] = await execCmd('kubectl config current-context')
  } catch (error) {
    console.info('No cluster currently set')
  }

  // We expect the context to be the cluster name. If the context isn't known,
  // we get the context from AWS.
  if (currentCluster === null || currentCluster.trim() !== clusterConfig.clusterName) {
    const [existingContextsStr] = await execCmdWithExitOnFailure('kubectl config get-contexts -o name')
    const existingContexts = existingContextsStr.trim().split('\n')
    if (existingContexts.includes(clusterConfig.clusterName)) {
      await execCmdWithExitOnFailure(`kubectl config use-context ${clusterConfig.clusterName}`)
    } else {
      // If we don't already have the context, get it from AWS.
      await execCmdWithExitOnFailure(
        `aws eks --region ${clusterConfig.clusterRegion} update-kubeconfig --name ${clusterConfig.clusterName} --alias ${clusterConfig.clusterName}`
        ) 
    }
  }
  await setupCluster(celoEnv, clusterConfig)
}

// setupCluster is idempotent-- it will only make changes that have not been made
// before. Therefore, it's safe to be called for a cluster that's been fully set up before
async function setupCluster(celoEnv: string, clusterConfig: AwsClusterConfig) {
  await createNamespaceIfNotExists(celoEnv)

  console.info('Performing any cluster setup that needs to be done...')

  await redeployTiller()
  await installAndEnableMetricsDeps(true, clusterConfig)
  // TODO Find a substitute for AADPodIdentity on AWS
  // Should not execute AADPodIdentity if on AWS
  // await installAADPodIdentity()
}

// IP ADDRESS RELATED
// IP addresses in AWS will have the following tags:
// tag=resourceGroupTag Value=DynamicEnvVar.ORACLE_RESOURCE_GROUP_TAG
// tag=IPNodeName Value=`${getStaticIPNamePrefix(celoEnv)}-${i}`

export async function registerAWSStaticIPIfNotRegistered(name: string, resourceGroup: string) {
  // This returns an array of matching IP addresses. If there is no matching IP
  // address, an empty array is returned. We expect at most 1 matching IP

  // This fetches the IP addresses allocated that have the corresponding tag values of resourceGroup and name
  const [existingIpsStr] = await execCmdWithExitOnFailure(
    `aws ec2 describe-addresses --filters "Name=tag:resourceGroupTag,Values=${resourceGroup}" "Name=tag:IPNodeName,Values=${name}" --query 'Addresses[*].[PublicIp]' --output json`
  )
  const existingIps = JSON.parse(existingIpsStr)
  if (existingIps.length) {
    console.info(`Skipping IP address registration, ${name} on ${resourceGroup} exists`)
    // We expect only 1 matching IP
    return existingIps[0]
  }
  console.info(`Registering IP address on AWS with tags where IPNodeName is ${name} and resourceGroupTag is ${resourceGroup}`)

  // Allocate address on AWS and store allocationID
  const [allocationID] = await execCmdWithExitOnFailure(
    `aws ec2 allocate-address --query '[AllocationId]' --output text`
  )

  // Add tags to allocationID
  await execCmdWithExitOnFailure(
    `aws ec2 create-tags
     --resources ${allocationID.trim()} --tags Key=resourceGroupTag,Value=${resourceGroup} Key=IPNodeName,Value=${name}` 
  )

  // Fetch Address of newly created
  const [address] = await execCmdWithExitOnFailure(
    `aws ec2 describe-addresses --filters "Name=tag:resourceGroupTag,Values=${resourceGroup}" "Name=tag:IPNodeName,Values=${name}" --query 'Addresses[*].[PublicIp]' --output json`
  )

  return address.trim()
}

export async function deallocateAWSStaticIP(name: string, resourceGroup: string) {
  console.info(`Deallocating IP address ${name} on ${resourceGroup}`)
  const [allocationID] = await execCmdWithExitOnFailure(
    `aws ec2 describe-addresses --filters "Name=tag:resourceGroupTag,Values=${resourceGroup}" "Name=tag:IPNodeName,Values=${name}" --query 'Addresses[*].[allocationID]' --output text`
  )
  return execCmdWithExitOnFailure(
    // `az network public-ip delete --resource-group ${allocationID} --name ${name}`
    `aws ec2 release-address --allocation-id ${allocationID.trim()}`
  )
}
