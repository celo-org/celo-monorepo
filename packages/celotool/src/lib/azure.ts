import { installPrometheusIfNotExists } from 'src/lib/aks-prometheus'
import { createNamespaceIfNotExists } from 'src/lib/cluster'
import { execCmd, execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { doCheckOrPromptIfStagingOrProduction } from 'src/lib/env-utils'
import { installAndEnableMetricsDeps, redeployTiller } from 'src/lib/helm_deploy'
import { outputIncludes } from 'src/lib/utils'

/**
 * Basic info for an AKS cluster
 */
export interface AzureClusterConfig {
  tenantId: string
  resourceGroup: string
  clusterName: string
  subscriptionId: string
}

// switchToCluster configures kubectl to connect to the AKS cluster
export async function switchToCluster(
  celoEnv: string,
  clusterConfig: AzureClusterConfig,
  checkOrPromptIfStagingOrProduction = true
) {
  if (checkOrPromptIfStagingOrProduction) {
    await doCheckOrPromptIfStagingOrProduction()
  }

  // Azure subscription switch
  let currentTenantId = null
  try {
    ;[currentTenantId] = await execCmd('az account show --query tenantId -o tsv')
  } catch (error) {
    console.info('No azure account subscription currently set')
  }
  if (currentTenantId === null || currentTenantId.trim() !== clusterConfig.tenantId) {
    await execCmdWithExitOnFailure(`az account set --subscription ${clusterConfig.tenantId}`)
  }

  let currentCluster = null
  try {
    ;[currentCluster] = await execCmd('kubectl config current-context')
  } catch (error) {
    console.info('No cluster currently set')
  }

  if (currentCluster === null || currentCluster.trim() !== clusterConfig.clusterName) {
    // If a context is edited for some reason (eg switching default namespace),
    // a warning and prompt is shown asking if the existing context should be
    // overwritten. To avoid this, --overwrite-existing force overwrites.
    await execCmdWithExitOnFailure(
      `az aks get-credentials --resource-group ${clusterConfig.resourceGroup} --name ${clusterConfig.clusterName} --subscription ${clusterConfig.subscriptionId} --overwrite-existing`
    )
  }
  await setupCluster(celoEnv, clusterConfig)
}

// setupCluster is idempotent-- it will only make changes that have not been made
// before. Therefore, it's safe to be called for a cluster that's been fully set up before
async function setupCluster(celoEnv: string, clusterConfig: AzureClusterConfig) {
  await createNamespaceIfNotExists(celoEnv)

  console.info('Performing any cluster setup that needs to be done...')

  await redeployTiller()
  await installPrometheusIfNotExists(clusterConfig)
  await installAndEnableMetricsDeps(false)
  await installAADPodIdentity()
}

// installAADPodIdentity installs the resources necessary for AAD pod level identities
async function installAADPodIdentity() {
  // The helm chart maintained directly by AAD Pod Identity is not compatible with helm v2.
  // Until we upgrade to helm v3, we rely on our own helm chart adapted from:
  // https://raw.githubusercontent.com/Azure/aad-pod-identity/8a5f2ed5941496345592c42e1d6cbd12c32aeebf/deploy/infra/deployment-rbac.yaml
  const aadPodIdentityExists = await outputIncludes(
    `helm list`,
    `aad-pod-identity`,
    `aad-pod-identity exists, skipping install`
  )
  if (!aadPodIdentityExists) {
    console.info('Installing aad-pod-identity')
    await execCmdWithExitOnFailure(
      `helm install --name aad-pod-identity ../helm-charts/aad-pod-identity`
    )
  }
}

// createIdentityIfNotExists creates an identity if it doesn't already exist.
// Returns an object including basic info on the identity.
export async function createIdentityIfNotExists(
  clusterConfig: AzureClusterConfig,
  identityName: string
) {
  // This command is idempotent-- if the identity exists, the existing one is given
  const [results] = await execCmdWithExitOnFailure(
    `az identity create -n ${identityName} -g ${clusterConfig.resourceGroup} -o json`
  )
  return JSON.parse(results)
}

/**
 * deleteIdentity gets basic info on an existing identity
 */
export function deleteIdentity(clusterConfig: AzureClusterConfig, identityName: string) {
  return execCmdWithExitOnFailure(
    `az identity delete -n ${identityName} -g ${clusterConfig.resourceGroup} -o json`
  )
}

/**
 * getIdentity gets basic info on an existing identity
 */
export async function getIdentity(clusterConfig: AzureClusterConfig, identityName: string) {
  const [results] = await execCmdWithExitOnFailure(
    `az identity show -n ${identityName} -g ${clusterConfig.resourceGroup} -o json`
  )
  return JSON.parse(results)
}

export async function getAKSNodeResourceGroup(clusterConfig: AzureClusterConfig) {
  const [nodeResourceGroup] = await execCmdWithExitOnFailure(
    `az aks show --name ${clusterConfig.clusterName} --resource-group ${clusterConfig.resourceGroup} --query nodeResourceGroup -o tsv`
  )
  return nodeResourceGroup.trim()
}

export async function registerStaticIP(name: string, resourceGroupIP: string) {
  console.info(`Registering IP address ${name} on ${resourceGroupIP}`)
  const [address] = await execCmdWithExitOnFailure(
    `az network public-ip create --resource-group ${resourceGroupIP} --name ${name} --allocation-method Static --sku Standard --query publicIp.ipAddress -o tsv`
  )
  return address.trim()
}

export async function deallocateStaticIP(name: string, resourceGroupIP: string) {
  console.info(`Deallocating IP address ${name} on ${resourceGroupIP}`)
  return execCmdWithExitOnFailure(
    `az network public-ip delete --resource-group ${resourceGroupIP} --name ${name}`
  )
}
