import sleep from 'sleep-promise'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { retryCmd } from 'src/lib/utils'
import { getAksClusterConfig } from './context-utils'
import { AksClusterConfig } from './k8s-cluster/aks'

/**
 * getIdentity gets basic info on an existing identity. If the identity doesn't
 * exist, undefined is returned
 */
export async function getIdentity(clusterConfig: AksClusterConfig, identityName: string) {
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
    console.info(
      `Skipping identity creation, ${identityName} in resource group ${clusterConfig.resourceGroup} already exists`
    )
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

export async function assignRoleIdempotent(
  assigneeObjectId: string,
  assigneePrincipalType: string,
  scope: string,
  role: string
) {
  if (await roleIsAssigned(assigneeObjectId, scope, role)) {
    console.info(
      `Skipping role assignment, role ${role} already assigned to ${assigneeObjectId} for scope ${scope}`
    )
    return
  }
  console.info(
    `Assigning role ${role} to ${assigneeObjectId} type ${assigneePrincipalType} for scope ${scope}`
  )
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
    `az ad sp show --id ${servicePrincipalClientId} --query id -o tsv`
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

/**
 * This creates an Azure identity to access a key vault
 */
export async function createKeyVaultIdentityIfNotExists(
  context: string,
  identityName: string,
  keyVaultName: string,
  keyVaultResourceGroup: string | null | undefined,
  keyPermissions: string[] | null,
  secretPermissions: string[] | null
) {
  const clusterConfig = getAksClusterConfig(context)
  const identity = await createIdentityIdempotent(clusterConfig, identityName)
  // We want to grant the identity for the cluster permission to manage the odis signer identity.
  // Get the correct object ID depending on the cluster configuration, either
  // the service principal or the managed service identity.
  // See https://github.com/Azure/aad-pod-identity/blob/b547ba86ab9b16d238db8a714aaec59a046afdc5/docs/readmes/README.role-assignment.md#obtaining-the-id-of-the-managed-identity--service-principal
  let assigneeObjectId = await getAKSServicePrincipalObjectId(clusterConfig)
  let assigneePrincipalType = 'ServicePrincipal'
  // TODO Check how to manage the MSI type
  if (!assigneeObjectId) {
    assigneeObjectId = await getAKSManagedServiceIdentityObjectId(clusterConfig)
    // assigneePrincipalType = 'MSI'
    assigneePrincipalType = 'ServicePrincipal'
  }
  await assignRoleIdempotent(
    assigneeObjectId,
    assigneePrincipalType,
    identity.id,
    'Managed Identity Operator'
  )
  // Allow the odis signer identity to access the correct key vault
  await setKeyVaultPolicyIfNotSet(
    clusterConfig,
    keyVaultName,
    keyVaultResourceGroup,
    identity,
    keyPermissions,
    secretPermissions
  )
  return identity
}

async function setKeyVaultPolicyIfNotSet(
  clusterConfig: AksClusterConfig,
  keyVaultName: string,
  keyVaultResourceGroup: string | null | undefined,
  azureIdentity: any,
  keyPermissions: string[] | null,
  secretPermissions: string[] | null
) {
  const kvResourceGroup = keyVaultResourceGroup
    ? keyVaultResourceGroup
    : clusterConfig.resourceGroup

  const queryFilters = [`?objectId == '${azureIdentity.principalId}'`]
  if (keyPermissions) {
    queryFilters.push(
      `sort(permissions.keys) == [${keyPermissions.map((perm) => `'${perm}'`).join(', ')}]`
    )
  }
  if (secretPermissions) {
    queryFilters.push(
      `sort(permissions.secrets) == [${secretPermissions.map((perm) => `'${perm}'`).join(', ')}]`
    )
  }

  const [keyVaultPoliciesStr] = await execCmdWithExitOnFailure(
    `az keyvault show --name ${keyVaultName} -g ${kvResourceGroup} --query "properties.accessPolicies[${queryFilters.join(
      ' && '
    )}]"`
  )
  const keyVaultPolicies = JSON.parse(keyVaultPoliciesStr)
  if (keyVaultPolicies.length) {
    const keyPermStr = keyPermissions ? `key permissions: ${keyPermissions.join(' ')}` : ''
    const secretPermStr = secretPermissions
      ? `secret permissions: ${secretPermissions.join(' ')}`
      : ''
    console.info(
      `Skipping setting policy {${keyPermStr}, ${secretPermStr}}. Already set for vault ${keyVaultName} and identity objectId ${azureIdentity.principalId}`
    )
    return
  }

  if (keyPermissions) {
    console.info(
      `Setting key permissions ${keyPermissions.join(
        ' '
      )} for vault ${keyVaultName} and identity objectId ${azureIdentity.principalId}`
    )
    return execCmdWithExitOnFailure(
      `az keyvault set-policy --name ${keyVaultName} --key-permissions ${keyPermissions.join(
        ' '
      )} --object-id ${azureIdentity.principalId} -g ${kvResourceGroup}`
    )
  }

  if (secretPermissions) {
    console.info(
      `Setting secret permissions ${secretPermissions.join(
        ' '
      )} for vault ${keyVaultName} and identity objectId ${azureIdentity.principalId}`
    )
    return execCmdWithExitOnFailure(
      `az keyvault set-policy --name ${keyVaultName} --secret-permissions ${secretPermissions.join(
        ' '
      )} --object-id ${azureIdentity.principalId} -g ${kvResourceGroup}`
    )
  }
}

/**
 * deleteAzureKeyVaultIdentity deletes the key vault policy and the managed identity
 */
export async function deleteAzureKeyVaultIdentity(
  context: string,
  identityName: string,
  keyVaultName: string
) {
  const clusterConfig = getAksClusterConfig(context)
  await deleteKeyVaultPolicy(clusterConfig, identityName, keyVaultName)
  return deleteIdentity(clusterConfig, identityName)
}

async function deleteKeyVaultPolicy(
  clusterConfig: AksClusterConfig,
  identityName: string,
  keyVaultName: string
) {
  const azureIdentity = await getIdentity(clusterConfig, identityName)
  return execCmdWithExitOnFailure(
    `az keyvault delete-policy --name ${keyVaultName} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
  )
}

/**
 * @return the intended name of an azure identity given a key vault name
 */
export function getAzureKeyVaultIdentityName(
  context: string,
  prefix: string,
  keyVaultName: string
) {
  // from https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftmanagedidentity
  const maxIdentityNameLength = 128
  return `${prefix}-${keyVaultName}-${context}`.substring(0, maxIdentityNameLength)
}
