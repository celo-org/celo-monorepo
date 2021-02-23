import { assignRoleIdempotent, createIdentityIdempotent, deleteIdentity, getAKSManagedServiceIdentityObjectId, getAKSServicePrincipalObjectId, getIdentity } from 'src/lib/azure'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { AksClusterConfig } from './k8s-cluster/aks'
import { getAksClusterConfig } from './context-utils'

/**
 * This creates an Azure identity to access a key vault
 */
export async function createKeyVaultIdentityIfNotExists(
  context: string,
  identityName: string,
  keyVaultName: string,
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
  await assignRoleIdempotent(assigneeObjectId, assigneePrincipalType, identity.id, 'Managed Identity Operator')
  // Allow the odis signer identity to access the correct key vault
  await setKeyVaultPolicyIfNotSet(clusterConfig, keyVaultName, identity, keyPermissions, secretPermissions)
  return identity
}

async function setKeyVaultPolicyIfNotSet(
  clusterConfig: AksClusterConfig,
  keyVaultName: string,
  azureIdentity: any,
  keyPermissions: string[] | null,
  secretPermissions: string[] | null
) {

  const queryFilters = [`?objectId == '${azureIdentity.principalId}'`]
  if (keyPermissions) {
     queryFilters.push(`sort(permissions.keys) == [${keyPermissions.map(perm => `'${perm}'`).join(', ')}]`)
  }
  if (secretPermissions) {
    queryFilters.push(`sort(permissions.secrets) == [${secretPermissions.map(perm => `'${perm}'`).join(', ')}]`)
  }

  const [keyVaultPoliciesStr] = await execCmdWithExitOnFailure(
    `az keyvault show --name ${keyVaultName} -g ${clusterConfig.resourceGroup} --query "properties.accessPolicies[${queryFilters.join(" && ")}]"`
  )
  const keyVaultPolicies = JSON.parse(keyVaultPoliciesStr)
  if (keyVaultPolicies.length) {
    const keyPermStr = keyPermissions ? `key permissions: ${keyPermissions.join(' ')}` : ""
    const secretPermStr = secretPermissions ? `secret permissions: ${secretPermissions.join(' ')}` : ""
    console.info(`Skipping setting policy {${keyPermStr}, ${secretPermStr}}. Already set for vault ${keyVaultName} and identity objectId ${azureIdentity.principalId}`)
    return
  }

  if (keyPermissions) {
    console.info(`Setting key permissions ${keyPermissions.join(' ')} for vault ${keyVaultName} and identity objectId ${azureIdentity.principalId}`)
    return execCmdWithExitOnFailure(
      `az keyvault set-policy --name ${keyVaultName} --key-permissions ${keyPermissions.join(' ')} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
    )
  }

  if (secretPermissions) {
    console.info(`Setting secret permissions ${secretPermissions.join(' ')} for vault ${keyVaultName} and identity objectId ${azureIdentity.principalId}`)
    return execCmdWithExitOnFailure(
      `az keyvault set-policy --name ${keyVaultName} --secret-permissions ${secretPermissions.join(' ')} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
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
export function getAzureKeyVaultIdentityName(context: string, prefix: string, keyVaultName: string) {
  // from https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftmanagedidentity
  const maxIdentityNameLength = 128
  return `${prefix}-${keyVaultName}-${context}`.substring(0, maxIdentityNameLength)
}
