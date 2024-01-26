import { DynamicEnvVar, envVar, fetchEnv } from 'src/lib/env-utils'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'
import {
  createKeyVaultIdentityIfNotExists,
  deleteAzureKeyVaultIdentity,
  getAzureKeyVaultIdentityName,
} from './azure'
import { getAksClusterConfig, getContextDynamicEnvVarValues } from './context-utils'

const helmChartPath = '../helm-charts/odis'

/**
 * Information for the Azure Key Vault
 */
interface ODISSignerKeyVaultConfig {
  vaultName: string
  pnpKeyNameBase: string
  pnpKeyLatestVersion: string
  domainsKeyNameBase: string
  domainsKeyLatestVersion: string
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

/**
 * Information for the Blockchain provider connection
 */
interface ODISSignerBlockchainConfig {
  blockchainApiKey: string
}

/**
 * Information for the ODIS logging
 */
interface ODISSignerLoggingConfig {
  level: string
  format: string
}

/*
 * Prefix for the cluster's identity name
 */
const identityNamePrefix = 'ODISSIGNERID'

/**
 * Env vars corresponding to each value for the ODISSignerKeyVaultConfig for a particular context
 */
const contextODISSignerKeyVaultConfigDynamicEnvVars: {
  [k in keyof ODISSignerKeyVaultConfig]: DynamicEnvVar
} = {
  vaultName: DynamicEnvVar.ODIS_SIGNER_AZURE_KEYVAULT_NAME,
  pnpKeyNameBase: DynamicEnvVar.ODIS_SIGNER_AZURE_KEYVAULT_PNP_KEY_NAME_BASE,
  pnpKeyLatestVersion: DynamicEnvVar.ODIS_SIGNER_AZURE_KEYVAULT_PNP_KEY_LATEST_VERSION,
  domainsKeyNameBase: DynamicEnvVar.ODIS_SIGNER_AZURE_KEYVAULT_DOMAINS_KEY_NAME_BASE,
  domainsKeyLatestVersion: DynamicEnvVar.ODIS_SIGNER_AZURE_KEYVAULT_DOMAINS_KEY_LATEST_VERSION,
}

/**
 * Env vars corresponding to each value for the ODISSignerDatabaseConfig for a particular context
 */
const contextDatabaseConfigDynamicEnvVars: {
  [k in keyof ODISSignerDatabaseConfig]: DynamicEnvVar
} = {
  host: DynamicEnvVar.ODIS_SIGNER_DB_HOST,
  port: DynamicEnvVar.ODIS_SIGNER_DB_PORT,
  username: DynamicEnvVar.ODIS_SIGNER_DB_USERNAME,
  password: DynamicEnvVar.ODIS_SIGNER_DB_PASSWORD,
}

/**
 * Env vars corresponding to each value for the ODISSignerBlockchainConfig for a particular context
 */
const contextBlockchainConfigDynamicEnvVars: {
  [k in keyof ODISSignerBlockchainConfig]: DynamicEnvVar
} = {
  blockchainApiKey: DynamicEnvVar.ODIS_SIGNER_BLOCKCHAIN_API_KEY,
}

/**
 * Env vars corresponding to each value for the logging for a particular context
 */
const contextLoggingConfigDynamicEnvVars: {
  [k in keyof ODISSignerLoggingConfig]: DynamicEnvVar
} = {
  level: DynamicEnvVar.ODIS_SIGNER_LOG_LEVEL,
  format: DynamicEnvVar.ODIS_SIGNER_LOG_FORMAT,
}

function releaseName(celoEnv: string, context: string) {
  const contextK8sFriendly = context.toLowerCase().replace(/_/g, '-')
  return `${celoEnv}--${contextK8sFriendly}--odissigner`
}

export async function installODISHelmChart(celoEnv: string, context: string) {
  return installGenericHelmChart({
    namespace: celoEnv,
    releaseName: releaseName(celoEnv, context),
    chartDir: helmChartPath,
    parameters: await helmParameters(celoEnv, context),
  })
}

export async function upgradeODISChart(celoEnv: string, context: string) {
  return upgradeGenericHelmChart({
    namespace: celoEnv,
    releaseName: releaseName(celoEnv, context),
    chartDir: helmChartPath,
    parameters: await helmParameters(celoEnv, context),
  })
}

export async function removeHelmRelease(celoEnv: string, context: string) {
  await removeGenericHelmChart(releaseName(celoEnv, context), celoEnv)
  const keyVaultConfig = getContextDynamicEnvVarValues(
    contextODISSignerKeyVaultConfigDynamicEnvVars,
    context
  )

  await deleteAzureKeyVaultIdentity(
    context,
    getAzureKeyVaultIdentityName(context, identityNamePrefix, keyVaultConfig.vaultName),
    keyVaultConfig.vaultName
  )
}

async function helmParameters(celoEnv: string, context: string) {
  const blockchainConfig = getContextDynamicEnvVarValues(
    contextBlockchainConfigDynamicEnvVars,
    context
  )
  const databaseConfig = getContextDynamicEnvVarValues(contextDatabaseConfigDynamicEnvVars, context)
  const keyVaultConfig = getContextDynamicEnvVarValues(
    contextODISSignerKeyVaultConfigDynamicEnvVars,
    context
  )

  const loggingConfig = getContextDynamicEnvVarValues(contextLoggingConfigDynamicEnvVars, context, {
    level: 'trace',
    format: 'stackdriver',
  })

  const clusterConfig = getAksClusterConfig(context)

  return [
    `--set environment.name=${celoEnv}`,
    `--set environment.cluster.name=${clusterConfig.clusterName}`,
    `--set environment.cluster.location=${clusterConfig.regionName}`,
    `--set image.repository=${fetchEnv(envVar.ODIS_SIGNER_DOCKER_IMAGE_REPOSITORY)}`,
    `--set image.tag=${fetchEnv(envVar.ODIS_SIGNER_DOCKER_IMAGE_TAG)}`,
    `--set db.host=${databaseConfig.host}`,
    `--set db.port=${databaseConfig.port}`,
    `--set db.username=${databaseConfig.username}`,
    `--set db.password='${databaseConfig.password}'`,
    `--set keystore.vaultName=${keyVaultConfig.vaultName}`,
    `--set keystore.pnpKeyNameBase=${keyVaultConfig.pnpKeyNameBase}`,
    `--set keystore.domainsKeyNameBase=${keyVaultConfig.domainsKeyNameBase}`,
    `--set keystore.pnpKeyLatestVersion=${keyVaultConfig.pnpKeyLatestVersion}`,
    `--set keystore.domainsKeyLatestVersion=${keyVaultConfig.domainsKeyLatestVersion}`,
    `--set api.pnpAPIEnabled=${fetchEnv(envVar.ODIS_SIGNER_PNP_API_ENABLED)}`,
    `--set api.domainsAPIEnabled=${fetchEnv(envVar.ODIS_SIGNER_DOMAINS_API_ENABLED)}`,
    `--set blockchainProvider=${fetchEnv(envVar.ODIS_SIGNER_BLOCKCHAIN_PROVIDER)}`,
    `--set blockchainApiKey=${blockchainConfig.blockchainApiKey}`,
    `--set log.level=${loggingConfig.level}`,
    `--set log.format=${loggingConfig.format}`,
  ].concat(await ODISSignerKeyVaultIdentityHelmParameters(context, keyVaultConfig))
}

/**
 * Returns an array of helm command line parameters for the ODIS Signer key vault identity.
 */
async function ODISSignerKeyVaultIdentityHelmParameters(
  context: string,
  keyVaultConfig: ODISSignerKeyVaultConfig
) {
  const azureKVIdentity = await createKeyVaultIdentityIfNotExists(
    context,
    getAzureKeyVaultIdentityName(context, identityNamePrefix, keyVaultConfig.vaultName),
    keyVaultConfig.vaultName,
    null,
    null,
    ['get']
  )
  const params: string[] = [
    `--set azureKVIdentity.id=${azureKVIdentity.id}`,
    `--set azureKVIdentity.clientId=${azureKVIdentity.clientId}`,
  ]

  return params
}
