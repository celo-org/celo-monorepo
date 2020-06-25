import { createNamespaceIfNotExists } from 'src/lib/cluster'
import { execCmd, execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { doCheckOrPromptIfStagingOrProduction } from 'src/lib/env-utils'
import { installAndEnableMetricsDeps, redeployTiller } from 'src/lib/helm_deploy'
import { outputIncludes, retryCmd } from 'src/lib/utils'

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
    await execCmdWithExitOnFailure(`az account set --subscription ${clusterConfig.subscriptionId}`)
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
  await installAndEnableMetricsDeps(true, clusterConfig)
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

/**
 * getIdentity gets basic info on an existing identity. If the identity doesn't
 * exist, undefined is returned
 */
export async function getIdentity(
  clusterConfig: AzureClusterConfig,
  identityName: string
) {
  const [matchingIdentitiesStr] = await execCmdWithExitOnFailure(
    `az identity list -g ${clusterConfig.resourceGroup} --query "[?name == '${identityName}']" -o json`
  )
  const matchingIdentities = JSON.parse(matchingIdentitiesStr)
  if (!matchingIdentities.length) {
    return
  }
  // There should only be one exact match by name
  return matchingIdentities[0]
}

// createIdentityIfNotExists creates an identity if it doesn't already exist.
// Returns an object including basic info on the identity.
export async function createIdentityIfNotExists(
  clusterConfig: AzureClusterConfig,
  identityName: string
) {
  const identity = await getIdentity(clusterConfig, identityName)
  if (identity) {
    console.info(`Skipping identity creation, ${identityName} in resource group ${clusterConfig.resourceGroup} already exists`)
    return identity
  }
  console.info(`Creating identity ${identityName} in resource group ${clusterConfig.resourceGroup}`)
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

async function roleIsAssigned(assignee: string, scope: string, role: string) {
  const [matchingAssignedRoles] = await retryCmd(
    () =>
      execCmdWithExitOnFailure(
        `az role assignment list --assignee ${assignee} --scope ${scope} --query "length([?roleDefinitionName == '${role}'])" -o tsv`
      ),
    10
  )
  return parseInt(matchingAssignedRoles.trim(), 10) > 0
}

export async function assignRoleIfNotAssigned(assigneeObjectId: string, assigneePrincipalType: string, scope: string, role: string) {
  if (await roleIsAssigned(assigneeObjectId, scope, role)) {
    console.info(`Skipping role assignment, role ${role} already assigned to ${assigneeObjectId} for scope ${scope}`)
    return
  }
  console.info(`Assigning role ${role} to ${assigneeObjectId} type ${assigneePrincipalType} for scope ${scope}`)
  await retryCmd(
    () =>
      execCmdWithExitOnFailure(
        `az role assignment create --role "${role}" --assignee-object-id ${assigneeObjectId} --assignee-principal-type ${assigneePrincipalType} --scope ${scope}`
      ),
    10
  )
}

export async function getAKSNodeResourceGroup(clusterConfig: AzureClusterConfig) {
  const [nodeResourceGroup] = await execCmdWithExitOnFailure(
    `az aks show --name ${clusterConfig.clusterName} --resource-group ${clusterConfig.resourceGroup} --query nodeResourceGroup -o tsv`
  )
  return nodeResourceGroup.trim()
}

/**
 * Gets the AKS Service Principal Object ID if one exists. Otherwise, an empty string is given.
 */
export async function getAKSServicePrincipalObjectId(clusterConfig: AzureClusterConfig) {
  // Get the correct object ID depending on the cluster configuration
  // See https://github.com/Azure/aad-pod-identity/blob/b547ba86ab9b16d238db8a714aaec59a046afdc5/docs/readmes/README.role-assignment.md#obtaining-the-id-of-the-managed-identity--service-principal
  const [rawServicePrincipalClientId] = await execCmdWithExitOnFailure(
    `az aks show -n ${clusterConfig.clusterName} --query servicePrincipalProfile.clientId -g ${clusterConfig.resourceGroup} -o tsv`
  )
  console.info(`az aks show -n ${clusterConfig.clusterName} --query servicePrincipalProfile.clientId -g ${clusterConfig.resourceGroup} -o tsv`)
  console.info(rawServicePrincipalClientId)
  const servicePrincipalClientId = rawServicePrincipalClientId.trim()
  // This will be the value of the service principal client ID if a managed service identity
  // is being used instead of a service principal.
  if (servicePrincipalClientId === 'msi') {
    return ''
  }
  const [rawObjectId] = await execCmdWithExitOnFailure(
    `az ad sp show --id ${servicePrincipalClientId} --query objectId -o tsv`
  )
  return rawObjectId.trim()
}

/**
 * If an AKS cluster is using a managed service identity, the objectId is returned.
 * Otherwise, an empty string is given.
 */
export async function getAKSManagedServiceIdentityObjectId(clusterConfig: AzureClusterConfig) {
  const [managedIdentityObjectId] = await execCmdWithExitOnFailure(
    `az aks show -n ${clusterConfig.clusterName} --query identityProfile.kubeletidentity.objectId -g ${clusterConfig.resourceGroup} -o tsv`
  )
  return managedIdentityObjectId.trim()
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
