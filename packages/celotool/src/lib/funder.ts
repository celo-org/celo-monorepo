import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import {
  getFornoUrl,
  getFullNodeHttpRpcInternalUrl,
  getFullNodeWebSocketRpcInternalUrl,
} from 'src/lib/endpoints'
import { DynamicEnvVar, envVar, fetchEnv } from 'src/lib/env-utils'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'
import { createKeyVaultIdentityIfNotExists, deleteAzureKeyVaultIdentity } from './azure'
import {
  getAksClusterConfig,
  getContextDynamicEnvVarValues,
  getDynamicEnvVarValues,
} from './context-utils'

const helmChartPath = '../helm-charts/funder'
const rbacHelmChartPath = '../helm-charts/funder-rbac'

/**
 * Contains information needed when using Azure HSM signing
 */
interface AzureHsmIdentity {
  identityName: string
  keyVaultName: string
  // If a resource group is not specified, it is assumed to be the same
  // as the kubernetes cluster resource group specified in the AKSClusterConfig
  resourceGroup?: string
}

/**
 * Represents the identity of a single komenci relayer
 */
interface FunderIdentity {
  address: string
  azureHsmIdentity: AzureHsmIdentity
}

/**
 * Configuration for each watched token
 */
interface WatchedTokenConfig {
  token: string
  addressesToWatch: string
  balanceThreshold: string
  topupAmount: string
  cron: string
}

/**
 * Configuration for the funder service
 */
interface FunderConfig {
  identity: FunderIdentity
  configurations: WatchedTokenConfig[]
}

interface KeyVaultIdentityConfig {
  addressAzureKeyVault: string
}

/**
 * Env vars corresponding to each value for the KomenciKeyVaultIdentityConfig for a particular context
 */
const contextKeyVaultIdentityConfigDynamicEnvVars: {
  [k in keyof KeyVaultIdentityConfig]: DynamicEnvVar
} = {
  addressAzureKeyVault: DynamicEnvVar.FUNDER_ADDRESS_AZURE_KEY_VAULT,
}

/**
 * Env vars corresponding to the number of watched token configurations
 */
const contextConfigsCountDynamicEnvVars: {
  count: DynamicEnvVar
} = {
  count: DynamicEnvVar.FUNDER_CONFIGS_COUNT,
}

const contextWatchedTokenConfigDynamicEnvVars: {
  [k in keyof WatchedTokenConfig]: DynamicEnvVar
} = {
  token: DynamicEnvVar.FUNDER_CONFIG_TOKEN,
  addressesToWatch: DynamicEnvVar.FUNDER_CONFIG_ADDRESSES_TO_WATCH,
  balanceThreshold: DynamicEnvVar.FUNDER_CONFIG_BALANCE_THRESHOLD,
  topupAmount: DynamicEnvVar.FUNDER_CONFIG_TOPUP_AMOUNT,
  cron: DynamicEnvVar.FUNDER_CONFIG_CRON,
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-funder`
}

export async function installHelmChart(celoEnv: string, context: string, useForno: boolean) {
  // First install the funder-rbac helm chart.
  // This must be deployed before so we can use a resulting auth token so that
  // komenci pods can reach the K8s API server to change their aad labels
  await installFunderRBACHelmChart(celoEnv, context)
  // Then install the komenci helm chart
  return installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv, context, useForno)
  )
}

export async function upgradeHelmChart(celoEnv: string, context: string, useFullNodes: boolean) {
  await upgradeFunderRBACHelmChart(celoEnv, context)
  return upgradeGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv, context, useFullNodes)
  )
}

export async function removeHelmRelease(celoEnv: string, context: string) {
  await removeGenericHelmChart(releaseName(celoEnv), celoEnv)
  await removeFunderRBACHelmRelease(celoEnv)
  const funderConfig = getFunderConfig(context)
  await deleteAzureKeyVaultIdentity(
    context,
    funderConfig.identity.azureHsmIdentity.identityName,
    funderConfig.identity.azureHsmIdentity.keyVaultName
  )
}

async function helmParameters(celoEnv: string, context: string, useForno: boolean) {
  const funderConfig = getFunderConfig(context)

  const kubeServiceAccountSecretName = await rbacServiceAccountSecretName(celoEnv)
  const vars = getContextDynamicEnvVarValues(
    {
      network: DynamicEnvVar.FUNDER_NETWORK,
    },
    context
  )
  const httpRpcProviderUrl = useForno
    ? getFornoUrl(celoEnv)
    : getFullNodeHttpRpcInternalUrl(celoEnv)
  const wsRpcProviderUrl = getFullNodeWebSocketRpcInternalUrl(celoEnv)
  const clusterConfig = getAksClusterConfig(context)

  return [
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set environment.name=${celoEnv}`,
    `--set environment.network=${vars.network}`,
    `--set environment.cluster.name=${clusterConfig.clusterName}`,
    `--set environment.cluster.location=${clusterConfig.regionName}`,
    `--set image.repository=${fetchEnv(envVar.FUNDER_DOCKER_IMAGE_REPOSITORY)}`,
    `--set image.tag=${fetchEnv(envVar.FUNDER_DOCKER_IMAGE_TAG)}`,
    `--set kube.serviceAccountSecretName='${kubeServiceAccountSecretName}'`,
    `--set funder.rpcProviderUrls.http=${httpRpcProviderUrl}`,
    `--set funder.rpcProviderUrls.ws=${wsRpcProviderUrl}`,
  ]
    .concat(await funderIdentityHelmParameters(context, funderConfig))
    .concat(funderWatchedTokenConfigHelmParameters(funderConfig))
}

function funderWatchedTokenConfigHelmParameters(funderConfig: FunderConfig) {
  let params: string[] = []
  for (let index = 0; index < funderConfig.configurations.length; index++) {
    const prefix = `--set-string funder.configurations[${index}]`
    const config = funderConfig.configurations[index]
    params = params.concat([
      `${prefix}.token='${config.token}'`,
      `${prefix}.addressesToWatch='${config.addressesToWatch.replace(',', '\\,')}'`,
      `${prefix}.balanceThreshold='${config.balanceThreshold}'`,
      `${prefix}.topupAmount='${config.topupAmount}'`,
      `${prefix}.cron='${config.cron}'`,
    ])
  }

  return params
}

/**
 * Returns an array of helm command line parameters for the komenci relayer identities.
 * Supports both private key and Azure HSM signing.
 */
async function funderIdentityHelmParameters(context: string, funderConfig: FunderConfig) {
  let params: string[] = []
  const identity = funderConfig.identity
  const prefix = `--set funder.identity`
  params.push(`${prefix}.address=${identity.address}`)

  if (identity.azureHsmIdentity) {
    const azureIdentity = await createKeyVaultIdentityIfNotExists(
      context,
      identity.azureHsmIdentity.identityName,
      identity.azureHsmIdentity.keyVaultName,
      identity.azureHsmIdentity.resourceGroup,
      ['get', 'list', 'sign'],
      null
    )
    params = params.concat([
      `${prefix}.azure.id=${azureIdentity.id}`,
      `${prefix}.azure.clientId=${azureIdentity.clientId}`,
      `${prefix}.azure.keyVaultName=${identity.azureHsmIdentity.keyVaultName}`,
    ])
  } else {
    throw Error(`Incomplete relayer identity: ${identity}`)
  }
  return params
}

/**
 * Gives a config for all komencis for a particular context
 */
function getFunderConfig(context: string): FunderConfig {
  return {
    identity: getFunderIdentity(context),
    configurations: getWatchedTokenConfigurations(context),
  }
}

/**
 * Returns the funder identity from the Azure Key Vault env var
 */
function getFunderIdentity(context: string): FunderIdentity {
  const { addressAzureKeyVault } = getContextDynamicEnvVarValues(
    contextKeyVaultIdentityConfigDynamicEnvVars,
    context,
    {
      addressAzureKeyVault: '',
    }
  )
  if (addressAzureKeyVault === '') {
    throw Error('No komenci identity env vars specified')
  }

  const [address, keyVaultName, resourceGroup] = addressAzureKeyVault.split(':')
  // resourceGroup can be undefined
  if (!address || !keyVaultName) {
    throw Error(
      `Address or key vault name is invalid. Address: ${address} Key Vault Name: ${keyVaultName}`
    )
  }
  return {
    address,
    azureHsmIdentity: {
      identityName: getAzureIdentityName(keyVaultName, address),
      keyVaultName,
      resourceGroup,
    },
  }
}

/**
 * Returns the watched token configuration from the dynamic env vars
 */
function getWatchedTokenConfigurations(context: string): WatchedTokenConfig[] {
  const countConfig = getContextDynamicEnvVarValues(contextConfigsCountDynamicEnvVars, context, {
    count: '0',
  })
  const count = parseInt(countConfig.count, 10)
  if (isNaN(count) || count === 0) {
    throw Error('FUNDER_CONFIGS_COUNT dynamic env var is 0 or not defined')
  }
  const configs: WatchedTokenConfig[] = []

  for (let index = 0; index < count; index++) {
    const config = getDynamicEnvVarValues(contextWatchedTokenConfigDynamicEnvVars, {
      context,
      index,
    })

    if (Object.values(config).filter((v) => v === undefined).length > 0) {
      throw Error(`At least one of FUNDER_CONFIG_* for index ${index} is undefined`)
    }

    configs.push(config)
  }
  return configs
}

/**
 * @return the intended name of an azure identity given a key vault name and address
 */
function getAzureIdentityName(keyVaultName: string, address: string) {
  // from https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftmanagedidentity
  const maxIdentityNameLength = 128
  return `${keyVaultName}-${address}`.substring(0, maxIdentityNameLength)
}

// Komenci RBAC------
// We need the relayer pods to be able to change their label to accommodate
// limitations in aad-pod-identity & statefulsets (see https://github.com/Azure/aad-pod-identity/issues/237#issuecomment-611672987)
// To do this, we use an auth token that we get using the resources in the `komenci-rbac` chart

async function installFunderRBACHelmChart(celoEnv: string, context: string) {
  return installGenericHelmChart(
    celoEnv,
    rbacReleaseName(celoEnv),
    rbacHelmChartPath,
    rbacHelmParameters(celoEnv, context)
  )
}

async function upgradeFunderRBACHelmChart(celoEnv: string, context: string) {
  return upgradeGenericHelmChart(
    celoEnv,
    rbacReleaseName(celoEnv),
    rbacHelmChartPath,
    rbacHelmParameters(celoEnv, context)
  )
}

function removeFunderRBACHelmRelease(celoEnv: string) {
  return removeGenericHelmChart(rbacReleaseName(celoEnv), celoEnv)
}

function rbacHelmParameters(celoEnv: string, context: string) {
  const funderConfig = getFunderConfig(context)
  console.info(funderConfig)
  return [`--set environment.name=${celoEnv}`]
}

function rbacReleaseName(celoEnv: string) {
  return `${celoEnv}-funder-rbac`
}

async function rbacServiceAccountSecretName(celoEnv: string) {
  const name = rbacReleaseName(celoEnv)
  const [tokenName] = await execCmdWithExitOnFailure(
    `kubectl get serviceaccount --namespace=${celoEnv} ${name} -o=jsonpath="{.secrets[0]['name']}"`
  )
  return tokenName.trim()
}
