import { assignRoleIdempotent, createIdentityIdempotent, deleteIdentity, getAKSManagedServiceIdentityObjectId, getAKSServicePrincipalObjectId, getIdentity } from 'src/lib/azure'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { DynamicEnvVar, envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart, removeGenericHelmChart, upgradeGenericHelmChart } from 'src/lib/helm_deploy'
import { getAksClusterConfig, getContextDynamicEnvVarValues } from './context-utils'
import { AksClusterConfig } from './k8s-cluster/aks'

const helmChartPath = '../helm-charts/odis'

interface ODISSignerKeyVaultConfig {
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
  vaultName: DynamicEnvVar.ODIS_SIGNER_AZURE_KEYVAULT_NAME,
  secretName: DynamicEnvVar.ODIS_SIGNER_AZURE_KEYVAULT_SECRET_NAME,
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
) {
  console.log('Installing ODIS helm chart')
  return installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv, context)
  )
}

export async function upgradeODISChart(
  celoEnv: string,
  context: string,
) {
  return upgradeGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv, context)
  )
}

export async function removeHelmRelease(celoEnv: string, context: string) {
  await removeGenericHelmChart(releaseName(celoEnv), celoEnv)
  const keyVaultConfig = getContextDynamicEnvVarValues(
    contextODISSignerKeyVaultConfigDynamicEnvVars,
    context
  )  

  await deleteODISSignerAzureIdentity(context, keyVaultConfig)
}


async function helmParameters(celoEnv: string, context: string) {

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
      network: DynamicEnvVar.ODIS_NETWORK,
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
    `--set keystore.vaultName=${keyVaultConfig.vaultName}`,
    `--set keystore.secretName=${keyVaultConfig.secretName}`,
    `--set blockchainProvider=${fetchEnv(envVar.ODIS_SIGNER_BLOCKCHAIN_PROVIDER)}`,
    `--set publicHostname=${ODISSignerPublicHostname(clusterConfig.regionName, celoEnv)}`,    
  ].concat(await ODISSignerKeyVaultIdentityHelmParameters(context, keyVaultConfig))
}

function ODISSignerPublicHostname(regionName: string, celoEnv: string): string{
  return regionName + '.odissigner.' + celoEnv + '.' + fetchEnv(envVar.CLUSTER_DOMAIN_NAME) + '.org'
}

/**
 * Returns an array of helm command line parameters for the ODIS Signer key vault identity.
 */
async function ODISSignerKeyVaultIdentityHelmParameters(
  context: string,
  keyVaultConfig: ODISSignerKeyVaultConfig
) {
  const azureKVIdentity = await createODISSignerKeyVaultIdentityIfNotExists(context, keyVaultConfig)
  const params: string[] = [
        `--set azureKVIdentity.id=${azureKVIdentity.id}`,
        `--set azureKVIdentity.clientId=${azureKVIdentity.clientId}`,
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
  const identity = await createIdentityIdempotent(clusterConfig, getODISSignerAzureIdentityName(keyVaultConfig.vaultName, context))
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
  const secretPermissions = ['get']
  const [keyVaultPoliciesStr] = await execCmdWithExitOnFailure(
    `az keyvault show --name ${keyVaultConfig.vaultName} -g ${clusterConfig.resourceGroup} --query "properties.accessPolicies[?objectId == '${azureIdentity.principalId}' && sort(permissions.secrets) == [${secretPermissions.map(perm => `'${perm}'`).join(', ')}]]"`
  )
  const keyVaultPolicies = JSON.parse(keyVaultPoliciesStr)
  if (keyVaultPolicies.length) {
    console.info(`Skipping setting secret permissions, ${secretPermissions.join(' ')} already set for vault ${keyVaultConfig.vaultName} and identity objectId ${azureIdentity.principalId}`)
    return
  }
  console.info(`Setting secret permissions ${secretPermissions.join(' ')} for vault ${keyVaultConfig.vaultName} and identity objectId ${azureIdentity.principalId}`)
  return execCmdWithExitOnFailure(
    `az keyvault set-policy --name ${keyVaultConfig.vaultName} --secret-permissions ${secretPermissions.join(' ')} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
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
  await deleteODISSignerKeyVaultPolicy(clusterConfig, keyVaultConfig, context)
  return deleteIdentity(clusterConfig, getODISSignerAzureIdentityName(keyVaultConfig.vaultName, context))
}

async function deleteODISSignerKeyVaultPolicy(
  clusterConfig: AksClusterConfig,
  keyVaultConfig: ODISSignerKeyVaultConfig,
  context: string
) {
  const azureIdentity = await getIdentity(clusterConfig, getODISSignerAzureIdentityName(keyVaultConfig.vaultName, context))
  return execCmdWithExitOnFailure(
    `az keyvault delete-policy --name ${keyVaultConfig.vaultName} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
  )
}

/**
 * @return the intended name of an azure identity given a key vault name
 */
function getODISSignerAzureIdentityName(keyVaultName: string, context: string) {
  // from https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftmanagedidentity
  const maxIdentityNameLength = 128
  return `ODISSIGNERID-${keyVaultName}-${context}`.substring(0, maxIdentityNameLength)
}
