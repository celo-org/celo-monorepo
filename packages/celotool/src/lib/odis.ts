import { DynamicEnvVar, envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart, removeGenericHelmChart, upgradeGenericHelmChart } from 'src/lib/helm_deploy'
import { createKeyVaultIdentityIfNotExists, deleteAzureKeyVaultIdentity, getAzureKeyVaultIdentityName } from './azure'
import { getAksClusterConfig, getContextDynamicEnvVarValues } from './context-utils'

const helmChartPath = '../helm-charts/odis'

/**
 * Information for the Azure Key Vault
 */
interface ODISSignerKeyVaultConfig {
  vaultName: string
  secretName: string
}

/**
 * Information for the ODIS postgres db
 */
interface ODISSignerDatabaseConfig {
  host: string
  port: string
  username: string
  password: string
}

/*
 * Prefix for the cluster's identity name
 */
const identityNamePrefix = "ODISSIGNERID"

/**
 * Env vars corresponding to each value for the ODISSignerKeyVaultConfig for a particular context
 */
const contextODISSignerKeyVaultConfigDynamicEnvVars: { [k in keyof ODISSignerKeyVaultConfig]: DynamicEnvVar } = {
  vaultName: DynamicEnvVar.ODIS_SIGNER_AZURE_KEYVAULT_NAME,
  secretName: DynamicEnvVar.ODIS_SIGNER_AZURE_KEYVAULT_SECRET_NAME,
}

/**
 * Env vars corresponding to each value for the ODISSignerDatabaseConfig for a particular context
 */
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

  await deleteAzureKeyVaultIdentity(context,
				    getAzureKeyVaultIdentityName(context, identityNamePrefix, keyVaultConfig.vaultName),
				    keyVaultConfig.vaultName)
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
  const azureKVIdentity = await createKeyVaultIdentityIfNotExists(context,
								  getAzureKeyVaultIdentityName(context, identityNamePrefix, keyVaultConfig.vaultName),
								  keyVaultConfig.vaultName,
								  null,
								  null,
								  ['get'])
  const params: string[] = [
        `--set azureKVIdentity.id=${azureKVIdentity.id}`,
        `--set azureKVIdentity.clientId=${azureKVIdentity.clientId}`,
  ]
  
  return params
}