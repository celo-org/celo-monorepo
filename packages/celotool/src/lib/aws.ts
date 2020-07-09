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
  tag: string
  // subscriptionId: string
}

// switchToCluster configures kubectl to connect to the EKS cluster
export async function switchToAwsCluster(
  celoEnv: string,
  clusterConfig: AwsClusterConfig,
  checkOrPromptIfStagingOrProduction = true
) {
  if (checkOrPromptIfStagingOrProduction) {
    await doCheckOrPromptIfStagingOrProduction()
  }

  // TODO Look into switching subscription between testing and production
  // // Azure subscription switch
  // let currentTenantId = null
  // try {
  //   ;[currentTenantId] = await execCmd('az account show --query id -o tsv')
  // } catch (error) {
  //   console.info('No azure account subscription currently set')
  // }
  // if (currentTenantId === null || currentTenantId.trim() !== clusterConfig.tenantId) {
  //   await execCmdWithExitOnFailure(`az account set --subscription ${clusterConfig.subscriptionId}`)
  // }

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
  await installAndEnableMetricsDeps(true, clusterConfig.clusterName)
  // Should not execute AADPodIdentityif on AWS
  // await installAADPodIdentity()
}

// IP ADDRESS RELATED

export async function registerStaticIPIfNotRegistered(name: string, resourceGroupIP: string) {



  // This returns an array of matching IP addresses. If there is no matching IP
  // address, an empty array is returned. We expect at most 1 matching IP
  const [existingIpsStr] = await execCmdWithExitOnFailure(
    `az network public-ip list --resource-group ${resourceGroupIP} --query "[?name == '${name}' && sku.name == 'Standard'].ipAddress" -o json`
  )
  const existingIps = JSON.parse(existingIpsStr)
  if (existingIps.length) {
    console.info(`Skipping IP address registration, ${name} on ${resourceGroupIP} exists`)
    // We expect only 1 matching IP
    return existingIps[0]
  }
  console.info(`Registering IP address ${name} on ${resourceGroupIP}`)
  const [address] = await execCmdWithExitOnFailure(
    `az network public-ip create --resource-group ${resourceGroupIP} --name ${name} --allocation-method Static --sku Standard --query publicIp.ipAddress -o tsv`
  )
  return address.trim()
}

export async function deallocateStaticIP(name: string, allocationID: string) {
  console.info(`Deallocating IP address ${name} on ${allocationID}`)

  //aws ec2 release-address --allocation id (IP's allocationID)
  return execCmdWithExitOnFailure(
    `az network public-ip delete --resource-group ${allocationID} --name ${name}`
  )
}
