import { ensureLeading0x, privateKeyToAddress } from '@celo/utils/src/address'
import { assignRoleIdempotent, createIdentityIdempotent, deleteIdentity, getAKSManagedServiceIdentityObjectId, getAKSServicePrincipalObjectId, getIdentity } from 'src/lib/azure'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { DynamicEnvVar, envVar, fetchEnv, fetchEnvOrFallback } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
import { installGenericHelmChart, removeGenericHelmChart, upgradeGenericHelmChart } from 'src/lib/helm_deploy'
import { getAksClusterConfig, getContextDynamicEnvVarValues } from './context-utils'
import { AksClusterConfig } from './k8s-cluster/aks'

const helmChartPath = '../helm-charts/odis'

interface ODISSignerKeyVaultConfig {
  identityName: string
  vaultName: string
  secretName: string
}

interface ODISSignerDatabaseConfig {
  host: string
  port: string
  username: string
  password: string
}

/**
 * Env vars corresponding to each value for the ODISSignerKeyVaultIdentityConfig for a particular context
 */
const contextODISSignerKeyVaultConfigDynamicEnvVars: { [k in keyof ODISSignerKeyVaultConfig]: DynamicEnvVar } = {
  identityName: DynamicEnvVar.ODIS_SIGNER_AZURE_IDENTITY,
  vaultName: DynamicEnvVar.ODIS_SIGNER_AZURE_VAULT_NAME,
  secretName: DynamicEnvVar.ODIS_SIGNER_KEYSTORE_AZURE_SECRET_NAME,
}

const contextDatabaseConfigDynamicEnvVars: { [k in keyof ODISSignerDatabaseConfig]: DynamicEnvVar } = {
  host: DynamicEnvVar.ODIS_SIGNER_DB_HOST,
  port: DynamicEnvVar.ODIS_SIGNER_DB_PORT,
  username: DynamicEnvVar.ODIS_SIGNER_DB_USERNAME,
  password: DynamicEnvVar.ODIS_SIGNER_DB_PASSWORD,
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-odissigner`
}

export async function installODISHelmChart(
  celoEnv: string,
  context: string,
  useForno: boolean
) {
  return installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv, context, useForno)
  )
}

export async function upgradeODISChart(
  celoEnv: string,
  context: string,
  useFullNodes: boolean
) {
  return upgradeGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv, context, useFullNodes)
  )
}

export async function removeHelmRelease(celoEnv: string, context: string) {
  await removeGenericHelmChart(releaseName(celoEnv), celoEnv)
  const odisSignerConfig = getODISSignerConfig(context)
  if (odisSignerConfig.identity.azureHsmIdentity) {
      await deleteODISSignerAzureIdentity(context, identity)
    }
  }
}

async function getKeyVaultSecret(vaultName: string, secretName: string) {
  const [secret] = await execCmdWithExitOnFailure(
    `az keyvault secret show --name ${secretName} --vault-name ${vaultName} --query value`
  )
  return secret
}

async function helmParameters(celoEnv: string, context: string, useForno: boolean) {
  const odisSignerConfig = getODISSignerConfig(context)

  const databaseConfig = getContextDynamicEnvVarValues(
    contextDatabaseConfigDynamicEnvVars,
    context
  )
  const keyVaultConfig = getContextDynamicEnvVarValues(
    contextODISSignerKeyVaultConfigDynamicEnvVars,
    context
  )
  const vars = getContextDynamicEnvVarValues(
    {
      network: DynamicEnvVar.ODISSIGNER_NETWORK,
      blockchainProvider: DynamicEnvVar.ODIS_SIGNER_BLOCKCHAIN_PROVIDER,
    },
    context
  )
  const clusterConfig = getAksClusterConfig(context)

  return [
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set environment.name=${celoEnv}`,
    `--set environment.network=${vars.network}`,
    `--set environment.cluster.name=${clusterConfig.clusterName}`,
    `--set environment.cluster.location=${clusterConfig.regionName}`,
    `--set image.repository=${fetchEnv(envVar.ODIS_SIGNER_DOCKER_IMAGE_REPOSITORY)}`,
    `--set image.tag=${fetchEnv(envVar.ODIS_SIGNER_DOCKER_IMAGE_TAG)}`,
    `--set db.host=${databaseConfig.host}`,
    `--set db.port=${databaseConfig.port}`,
    `--set db.username=${databaseConfig.username}`,
    `--set db.password=${databaseConfig.password}`,
    `--set blockchainProvider=`${vars.ODIS_SIGNER_BLOCKCHAIN_PROVIDER}`,
  ].concat(await ODISSignerKeyVaultIdentityHelmParameters(context, keyVaultConfig))
}

/**
 * Returns an array of helm command line parameters for the ODIS Signer key vault identity.
 */
async function ODISSignerKeyVaultIdentityHelmParameters(
  context: string,
  keyVaultConfig: ODISSignerKeyVaultConfig
) {
  const azureKVIdentity = await createODISSignerKeyVaultIdentityIfNotExists(context, keyVaultConfig)
  const prefix = `--set relayer.identities[${i}]`  
  const params: string[] = [
        `azureKVIdentity.id=${azureKVIdentity.id}`,
        `azureKVIdentity.clientId=${azureKVIdentity.clientId}`,
  ]
  
  return params
}

/**
 * This creates an Azure identity for an ODIS signer.
 */
async function createODISSignerKeyVaultIdentityIfNotExists(
  context: string,
  keyVaultConfig: ODISSignerKeyVaultConfig
) {
  const clusterConfig = getAksClusterConfig(context)
  const identity = await createIdentityIdempotent(clusterConfig, keyVaultConfig.identityName)
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
  await setODISSIgnerKeyVaultPolicyIfNotSet(clusterConfig, keyVaultConfig, identity)
  return identity
}

async function setODISSIgnerKeyVaultPolicyIfNotSet(
  clusterConfig: AksClusterConfig,
  keyVaultConfig: ODISSignerKeyVaultConfig,
  azureIdentity: any
) {
  const keyPermissions = ['get', 'list', 'sign']
  const [keyVaultPoliciesStr] = await execCmdWithExitOnFailure(
    `az keyvault show --name ${keyVaultConfig.keyVaultName} -g ${clusterConfig.resoureGroup} --query "properties.accessPolicies[?objectId == '${azureIdentity.principalId}' && sort(permissions.keys) == [${keyPermissions.map(perm => `'${perm}'`).join(', ')}]]"`
  )
  const keyVaultPolicies = JSON.parse(keyVaultPoliciesStr)
  if (keyVaultPolicies.length) {
    console.info(`Skipping setting key permissions, ${keyPermissions.join(' ')} already set for vault ${keyVaultConfig.keyVaultName} and identity objectId ${azureIdentity.principalId}`)
    return
  }
  console.info(`Setting key permissions ${keyPermissions.join(' ')} for vault ${keyVaultConfig.keyVaultName} and identity objectId ${azureIdentity.principalId}`)
  return execCmdWithExitOnFailure(
    `az keyvault set-policy --name ${keyVaultConfig.keyVaultName} --key-permissions ${keyPermissions.join(' ')} --object-id ${azureIdentity.principalId} -g ${clusterCOnfig.resourseGroup}`
  )
}

/**
 * deleteODISSignerAzureIdentity deletes the key vault policy and the ODIS signer's managed identity
 */
async function deleteODISSignerAzureIdentity(
  context: string,
  keyVaultConfig: ODISSignerKeyVaultConfig  
) {
  const clusterConfig = getAksClusterConfig(context)
  await deleteODISSignerKeyVaultPolicy(clusterConfig, keyVaultConfig)
  return deleteIdentity(clusterConfig, keyVaultConfig.identityName)
}

async function deleteODISSignerKeyVaultPolicy(
  clusterConfig: AksClusterConfig,
  keyVaultConfig: ODISSignerKeyVaultConfig  
) {
  const azureIdentity = await getIdentity(clusterConfig, keyVaultConfig.identityName)
  return execCmdWithExitOnFailure(
    `az keyvault delete-policy --name ${keyVaultConfig.keyVaultName} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
  )
}
