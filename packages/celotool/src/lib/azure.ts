import sleep from 'sleep-promise'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { retryCmd } from 'src/lib/utils'
import { AksClusterConfig } from './k8s-cluster/aks'

/**
 * getIdentity gets basic info on an existing identity. If the identity doesn't
 * exist, undefined is returned
 */
export async function getIdentity(
  clusterConfig: AksClusterConfig,
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

// createIdentityIdempotent creates an identity if it doesn't already exist.
// Returns an object including basic info on the identity.
export async function createIdentityIdempotent(
  clusterConfig: AksClusterConfig,
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
export function deleteIdentity(clusterConfig: AksClusterConfig, identityName: string) {
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

export async function assignRoleIdempotent(assigneeObjectId: string, assigneePrincipalType: string, scope: string, role: string) {
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

export async function getAKSNodeResourceGroup(clusterConfig: AksClusterConfig) {
  const [nodeResourceGroup] = await execCmdWithExitOnFailure(
    `az aks show --name ${clusterConfig.clusterName} --resource-group ${clusterConfig.resourceGroup} --query nodeResourceGroup -o tsv`
  )
  return nodeResourceGroup.trim()
}

/**
 * Gets the AKS Service Principal Object ID if one exists. Otherwise, an empty string is given.
 */
export async function getAKSServicePrincipalObjectId(clusterConfig: AksClusterConfig) {
  // Get the correct object ID depending on the cluster configuration
  // See https://github.com/Azure/aad-pod-identity/blob/b547ba86ab9b16d238db8a714aaec59a046afdc5/docs/readmes/README.role-assignment.md#obtaining-the-id-of-the-managed-identity--service-principal
  const [rawServicePrincipalClientId] = await execCmdWithExitOnFailure(
    `az aks show -n ${clusterConfig.clusterName} --query servicePrincipalProfile.clientId -g ${clusterConfig.resourceGroup} -o tsv`
  )
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
export async function getAKSManagedServiceIdentityObjectId(clusterConfig: AksClusterConfig) {
  const [managedIdentityObjectId] = await execCmdWithExitOnFailure(
    `az aks show -n ${clusterConfig.clusterName} --query identityProfile.kubeletidentity.objectId -g ${clusterConfig.resourceGroup} -o tsv`
  )
  return managedIdentityObjectId.trim()
}

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

export async function deallocateStaticIP(name: string, resourceGroupIP: string) {
  console.info(`Deallocating IP address ${name} on ${resourceGroupIP}`)
  return execCmdWithExitOnFailure(
    `az network public-ip delete --resource-group ${resourceGroupIP} --name ${name}`
  )
}

export async function waitForStaticIPDetachment(name: string, resourceGroup: string) {
  const maxTryCount = 15
  const tryIntervalMs = 3000
  for (let tryCount = 0; tryCount < maxTryCount; tryCount++) {
    const [allocated] = await execCmdWithExitOnFailure(
      `az network public-ip show --resource-group ${resourceGroup} --name ${name} --query ipConfiguration.id -o tsv`
    )
    if (allocated.trim() === '') {
      return true
    }
    await sleep(tryIntervalMs)
  }
  throw Error(`Too many tries waiting for static IP association ID removal`)
}
