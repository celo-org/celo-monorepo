import { ensureLeading0x, privateKeyToAddress } from '@celo/utils/src/address'
import { assignRoleIfNotAssigned, AzureClusterConfig, createIdentityIfNotExists, deleteIdentity, getAKSManagedServiceIdentityObjectId, getAKSServicePrincipalObjectId, getIdentity, switchToCluster } from 'src/lib/azure'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { getFornoUrl, getFullNodeHttpRpcInternalUrl, getFullNodeWebSocketRpcInternalUrl } from 'src/lib/endpoints'
import { addCeloEnvMiddleware, DynamicEnvVar, envVar, fetchEnv, fetchEnvOrFallback, getDynamicEnvVarName } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
import { installGenericHelmChart, removeGenericHelmChart, upgradeGenericHelmChart } from 'src/lib/helm_deploy'
import yargs from 'yargs'

const helmChartPath = '../helm-charts/oracle'
const rbacHelmChartPath = '../helm-charts/oracle-rbac'

/**
 * Contains information needed when using Azure HSM signing
 */
interface OracleAzureHsmIdentity {
  identityName: string
  keyVaultName: string
  // If a resource group is not specified, it is assumed to be the same
  // as the kubernetes cluster resource group specified in the AzureClusterConfig
  resourceGroup?: string
}

/**
 * Represents the identity of a single oracle
 */
interface OracleIdentity {
  address: string
  // Used if generating oracle clients from a mnemonic
  privateKey?: string,
  // Used if using Azure HSM signing
  azureHsmIdentity?: OracleAzureHsmIdentity
}

/**
 * Configuration of multiple oracles
 */
interface OracleConfig {
  identities: OracleIdentity[]
}

/**
 * Env vars corresponding to each value for the AzureClusterConfig for a particular context
 */
const oracleContextAzureClusterConfigDynamicEnvVars: { [k in keyof AzureClusterConfig]: DynamicEnvVar } = {
  subscriptionId: DynamicEnvVar.ORACLE_AZURE_SUBSCRIPTION_ID,
  tenantId: DynamicEnvVar.ORACLE_AZURE_TENANT_ID,
  resourceGroup: DynamicEnvVar.ORACLE_AZURE_KUBERNETES_RESOURCE_GROUP,
  clusterName: DynamicEnvVar.ORACLE_KUBERNETES_CLUSTER_NAME,
}

interface OracleKeyVaultIdentityConfig {
  addressAzureKeyVaults: string
}

interface OracleMnemonicIdentityConfig {
  addressesFromMnemonicCount: string
}

/**
 * Env vars corresponding to each value for the OracleKeyVaultIdentityConfig for a particular context
 */
const oracleContextOracleKeyVaultIdentityConfigDynamicEnvVars: { [k in keyof OracleKeyVaultIdentityConfig]: DynamicEnvVar } = {
  addressAzureKeyVaults: DynamicEnvVar.ORACLE_ADDRESS_AZURE_KEY_VAULTS,
}

/**
 * Env vars corresponding to each value for the OracleMnemonicIdentityConfig for a particular context
 */
const oracleContextOracleMnemonicIdentityConfigDynamicEnvVars: { [k in keyof OracleMnemonicIdentityConfig]: DynamicEnvVar } = {
  addressesFromMnemonicCount: DynamicEnvVar.ORACLE_ADDRESSES_FROM_MNEMONIC_COUNT,
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-oracle`
}

export async function installHelmChart(
  celoEnv: string,
  oracleContext: string,
  useForno: boolean
) {
  // First install the oracle-rbac helm chart.
  // This must be deployed before so we can use a resulting auth token so that
  // oracle pods can reach the K8s API server to change their aad labels
  await installOracleRBACHelmChart(celoEnv, oracleContext)
  // Then install the oracle helm chart
  return installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv, oracleContext, useForno)
  )
}

export async function upgradeOracleChart(
  celoEnv: string,
  oracleContext: string,
  useFullNodes: boolean
) {
  await upgradeOracleRBACHelmChart(celoEnv, oracleContext)
  return upgradeGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv, oracleContext, useFullNodes)
  )
}

export async function removeHelmRelease(celoEnv: string, oracleContext: string) {
  await removeGenericHelmChart(releaseName(celoEnv))
  await removeOracleRBACHelmRelease(celoEnv)
  const oracleConfig = getOracleConfig(oracleContext)
  for (const identity of oracleConfig.identities) {
    // If the identity is using Azure HSM signing, clean it up too
    if (identity.azureHsmIdentity) {
      await deleteOracleAzureIdentity(oracleContext, identity)
    }
  }
}

async function helmParameters(celoEnv: string, oracleContext: string, useForno: boolean) {
  const oracleConfig = getOracleConfig(oracleContext)

  const replicas = oracleConfig.identities.length
  const kubeServiceAccountSecretNames = await rbacServiceAccountSecretNames(celoEnv, replicas)

  const httpRpcProviderUrl = useForno
    ? getFornoUrl(celoEnv)
    : getFullNodeHttpRpcInternalUrl(celoEnv)
  // TODO: let forno support websockets
  const wsRpcProviderUrl = getFullNodeWebSocketRpcInternalUrl(celoEnv)
  return [
    `--set environment.name=${celoEnv}`,
    `--set image.repository=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set image.tag=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_TAG)}`,
    `--set kube.serviceAccountSecretNames='{${kubeServiceAccountSecretNames.join(',')}}'`,
    `--set oracle.azureHsm.initTryCount=5`,
    `--set oracle.azureHsm.initMaxRetryBackoffMs=30000`,
    `--set oracle.replicas=${replicas}`,
    `--set oracle.rpcProviderUrls.http=${httpRpcProviderUrl}`,
    `--set oracle.rpcProviderUrls.ws=${wsRpcProviderUrl}`,
    `--set oracle.metrics.enabled=true`,
    `--set oracle.metrics.prometheusPort=9090`,
    `--set-string oracle.unusedOracleAddresses='${fetchEnvOrFallback(envVar.ORACLE_UNUSED_ORACLE_ADDRESSES, '').split(',').join('\\\,')}'`
  ].concat(await oracleIdentityHelmParameters(oracleContext, oracleConfig))
}

/**
 * Returns an array of helm command line parameters for the oracle identities.
 * Supports both private key and Azure HSM signing.
 */
async function oracleIdentityHelmParameters(
  oracleContext: string,
  oracleConfig: OracleConfig
) {
  const replicas = oracleConfig.identities.length
  let params: string[] = []
  for (let i = 0; i < replicas; i++) {
    const oracleIdentity = oracleConfig.identities[i]
    const prefix = `--set oracle.identities[${i}]`
    params.push(`${prefix}.address=${oracleIdentity.address}`)
    // An oracle identity can specify either a private key or some information
    // about an Azure Key Vault that houses an HSM with the address provided.
    // We provide the appropriate parameters for both of those types of identities.
    if (oracleIdentity.azureHsmIdentity) {
      const azureIdentity = await createOracleAzureIdentityIfNotExists(oracleContext, oracleIdentity)
      params = params.concat([
        `${prefix}.azure.id=${azureIdentity.id}`,
        `${prefix}.azure.clientId=${azureIdentity.clientId}`,
        `${prefix}.azure.keyVaultName=${oracleIdentity.azureHsmIdentity.keyVaultName}`,
      ])
    } else if (oracleIdentity.privateKey) {
      params.push(`${prefix}.privateKey=${oracleIdentity.privateKey}`)
    } else {
      throw Error(`Incomplete oracle identity: ${oracleIdentity}`)
    }
  }
  return params
}

/**
 * This creates an Azure identity for a specific oracle identity. Should only be
 * called when an oracle identity is using an Azure Key Vault for HSM signing
 */
async function createOracleAzureIdentityIfNotExists(
  oracleContext: string,
  oracleIdentity: OracleIdentity
) {
  const clusterConfig = getAzureClusterConfig(oracleContext)
  const identity = await createIdentityIfNotExists(clusterConfig, oracleIdentity.azureHsmIdentity!.identityName!)
  // We want to grant the identity for the cluster permission to manage the oracle identity.
  // Get the correct object ID depending on the cluster configuration, either
  // the service principal or the managed service identity.
  // See https://github.com/Azure/aad-pod-identity/blob/b547ba86ab9b16d238db8a714aaec59a046afdc5/docs/readmes/README.role-assignment.md#obtaining-the-id-of-the-managed-identity--service-principal
  let assigneeObjectId = await getAKSServicePrincipalObjectId(clusterConfig)
  let assigneePrincipalType = 'ServicePrincipal'
  if (!assigneeObjectId) {
    assigneeObjectId = await getAKSManagedServiceIdentityObjectId(clusterConfig)
    assigneePrincipalType = 'MSI'
  }
  await assignRoleIfNotAssigned(assigneeObjectId, assigneePrincipalType, identity.id, 'Managed Identity Operator')
  // Allow the oracle identity to access the correct key vault
  await setOracleKeyVaultPolicyIfNotSet(clusterConfig, oracleIdentity, identity)
  return identity
}

async function setOracleKeyVaultPolicyIfNotSet(
  clusterConfig: AzureClusterConfig,
  oracleIdentity: OracleIdentity,
  azureIdentity: any
) {
  const keyPermissions = ['get', 'list', 'sign']
  const keyVaultResourceGroup = oracleIdentity.azureHsmIdentity!.resourceGroup ?
    oracleIdentity.azureHsmIdentity!.resourceGroup :
    clusterConfig.resourceGroup
  const [keyVaultPoliciesStr] = await execCmdWithExitOnFailure(
    `az keyvault show --name ${oracleIdentity.azureHsmIdentity!.keyVaultName} -g ${keyVaultResourceGroup} --query "properties.accessPolicies[?objectId == '${azureIdentity.principalId}' && sort(permissions.keys) == [${keyPermissions.map(perm => `'${perm}'`).join(', ')}]]"`
  )
  const keyVaultPolicies = JSON.parse(keyVaultPoliciesStr)
  if (keyVaultPolicies.length) {
    console.info(`Skipping setting key permissions, ${keyPermissions.join(' ')} already set for vault ${oracleIdentity.azureHsmIdentity!.keyVaultName} and identity objectId ${azureIdentity.principalId}`)
    return
  }
  console.info(`Setting key permissions ${keyPermissions.join(' ')} for vault ${oracleIdentity.azureHsmIdentity!.keyVaultName} and identity objectId ${azureIdentity.principalId}`)
  return execCmdWithExitOnFailure(
    `az keyvault set-policy --name ${oracleIdentity.azureHsmIdentity!.keyVaultName} --key-permissions ${keyPermissions.join(' ')} --object-id ${azureIdentity.principalId} -g ${keyVaultResourceGroup}`
  )
}

/**
 * deleteOracleAzureIdentity deletes the key vault policy and the oracle's managed identity
 */
async function deleteOracleAzureIdentity(
  oracleContext: string,
  oracleIdentity: OracleIdentity
) {
  const clusterConfig = getAzureClusterConfig(oracleContext)
  await deleteOracleKeyVaultPolicy(clusterConfig, oracleIdentity)
  return deleteIdentity(clusterConfig, oracleIdentity.azureHsmIdentity!.identityName)
}

async function deleteOracleKeyVaultPolicy(
  clusterConfig: AzureClusterConfig,
  oracleIdentity: OracleIdentity
) {
  const azureIdentity = await getIdentity(clusterConfig, oracleIdentity.azureHsmIdentity!.identityName)
  return execCmdWithExitOnFailure(
    `az keyvault delete-policy --name ${oracleIdentity.azureHsmIdentity!.keyVaultName} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
  )
}

/**
 * Gives a config for all oracles for a particular context
 */
function getOracleConfig(oracleContext: string): OracleConfig {
  return {
    identities: getOracleIdentities(oracleContext),
  }
}

/**
 * Returns an array of oracle identities. If the Azure Key Vault env var is specified,
 * the identities are created from that. Otherwise, the identities are created
 * with private keys generated by the mnemonic.
 */
function getOracleIdentities(oracleContext: string): OracleIdentity[] {
  const { addressAzureKeyVaults } = getOracleContextDynamicEnvVarValues(
    oracleContextOracleKeyVaultIdentityConfigDynamicEnvVars,
    oracleContext,
    {
      addressAzureKeyVaults: '',
    }
  )
  // Give priority to key vault
  if (addressAzureKeyVaults) {
    return getAzureHsmOracleIdentities(addressAzureKeyVaults)
  }

  // If key vaults are not set, try from mnemonic
  const { addressesFromMnemonicCount } = getOracleContextDynamicEnvVarValues(
    oracleContextOracleMnemonicIdentityConfigDynamicEnvVars,
    oracleContext,
    {
      addressesFromMnemonicCount: '',
    }
  )
  if (addressesFromMnemonicCount) {
    const addressesFromMnemonicCountNum = parseInt(addressesFromMnemonicCount, 10)
    return getMnemonicBasedOracleIdentities(addressesFromMnemonicCountNum)
  }

  throw Error('No oracle identity env vars specified')
}

/**
 * Given a string addressAzureKeyVaults of the form:
 * <address>:<keyVaultName>,<address>:<keyVaultName>
 * eg: 0x0000000000000000000000000000000000000000:keyVault0,0x0000000000000000000000000000000000000001:keyVault1
 * returns an array of OracleIdentity in the same order
 */
function getAzureHsmOracleIdentities(addressAzureKeyVaults: string): OracleIdentity[] {
  const identityStrings = addressAzureKeyVaults.split(',')
  const identities = []
  for (const identityStr of identityStrings) {
    const [address, keyVaultName, resourceGroup] = identityStr.split(':')
    // resourceGroup can be undefined
    if (!address || !keyVaultName) {
      throw Error(
        `Address or key vault name is invalid. Address: ${address} Key Vault Name: ${keyVaultName}`
      )
    }
    identities.push({
      address,
      azureHsmIdentity: {
        identityName: getOracleAzureIdentityName(keyVaultName, address),
        keyVaultName,
        resourceGroup
      }
    })
  }
  return identities
}

/**
 * Returns oracle identities with private keys and addresses generated from the mnemonic
 */
function getMnemonicBasedOracleIdentities(count: number): OracleIdentity[] {
  return getPrivateKeysFor(
    AccountType.PRICE_ORACLE,
    fetchEnv(envVar.MNEMONIC),
    count
  ).map((pkey) => ({
    address: privateKeyToAddress(pkey),
    privateKey: ensureLeading0x(pkey),
  }))
}

/**
 * @return the intended name of an azure identity given a key vault name and address
 */
function getOracleAzureIdentityName(keyVaultName: string, address: string) {
  // from https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftmanagedidentity
  const maxIdentityNameLength = 128
  return `${keyVaultName}-${address}`.substring(0, maxIdentityNameLength)
}

/**
 * Fetches the env vars for a particular context
 * @param oracleContext the oracle context to use
 * @return an AzureClusterConfig for the context
 */
export function getAzureClusterConfig(oracleContext: string): AzureClusterConfig {
  return getOracleContextDynamicEnvVarValues(oracleContextAzureClusterConfigDynamicEnvVars, oracleContext)
}

/**
 * Gives an object with the values of dynamic environment variables for an oracle context.
 * @param dynamicEnvVars an object whose values correspond to the desired
 *   dynamic env vars to fetch.
 * @param oracleContext The oracle context
 * @param defaultValues Optional default values if the dynamic env vars are not found
 * @return an object with the same keys as dynamicEnvVars, but the values are
 *   the values of the dynamic env vars for the particular oracleContext
 */
export function getOracleContextDynamicEnvVarValues<T>(
  dynamicEnvVars: { [k in keyof T]: DynamicEnvVar },
  oracleContext: string,
  defaultValues?: { [k in keyof T]: string }
): {
  [k in keyof T]: string
} {
  return Object.keys(dynamicEnvVars).reduce(
    (values: any, k: string) => {
      const key = k as keyof T
      const dynamicEnvVar = dynamicEnvVars[key]
      const dynamicEnvVarName = getDynamicEnvVarName(dynamicEnvVar, {
        oracleContext
      })
      const defaultValue = defaultValues ? defaultValues[key] : undefined
      const value = defaultValue !== undefined ?
        fetchEnvOrFallback(dynamicEnvVarName, defaultValue) :
        fetchEnv(dynamicEnvVarName)
      return {
        ...values,
        [key]: value,
      }
    },
  {})
}

/**
 * Switches to the AKS cluster associated with the given context
 */
export function switchToAzureContextCluster(celoEnv: string, oracleContext: string) {
  if (!isValidOracleContext(oracleContext)) {
    throw Error(`Invalid oracle context, must be one of ${fetchEnv(envVar.ORACLE_CONTEXTS)}`)
  }
  const azureClusterConfig = getAzureClusterConfig(oracleContext)
  return switchToCluster(celoEnv, azureClusterConfig)
}

/**
 * yargs argv type for an oracle related command.
 */
export interface OracleArgv {
  context: string
}

/**
 * Coerces the value of context to be all upper-case and underscore-separated
 * rather than dash-separated. If the resulting context does not match a regex
 * requiring all caps, alphanumeric, and dash-only characters
 * (must start with letter and not end with an underscore), it will throw.
 */
function coerceOracleContext(rawContextStr: string) {
  const context = rawContextStr
    .toUpperCase()
    .replace(/-/g, '_')
  if (!RegExp('^[A-Z][A-Z0-9_]*[A-Z0-9]$').test(context)) {
    throw Error(`Invalid oracle context. Raw ${rawContextStr}, implied ${context}`)
  }
  return context
}

function isValidOracleContext(oracleContext: string) {
  const validOracleContexts = fetchEnv(envVar.ORACLE_CONTEXTS)
    .split(',')
  const validOracleContextsCoerced = validOracleContexts.map(coerceOracleContext)
  return validOracleContextsCoerced.includes(oracleContext)
}

/**
 * Middleware for an oracle related command.
 * One of primary or secondary must be true, but not both.
 * Instead of relying on one boolean, the two booleans are used to give the commands
 * a more explicit cleaner interface.
 */
export function addOracleMiddleware(argv: yargs.Argv) {
  return addCeloEnvMiddleware(argv)
    .option('context', {
      description: 'Oracle context to perform the deployment in',
      type: 'string',
    })
    .coerce('context', coerceOracleContext)
}

// Oracle RBAC------
// We need the oracle pods to be able to change their label to accommodate
// limitations in aad-pod-identity & statefulsets (see https://github.com/Azure/aad-pod-identity/issues/237#issuecomment-611672987)
// To do this, we use an auth token that we get using the resources in the `oracle-rbac` chart

async function installOracleRBACHelmChart(celoEnv: string, oracleContext: string) {
  return installGenericHelmChart(
    celoEnv,
    rbacReleaseName(celoEnv),
    rbacHelmChartPath,
    rbacHelmParameters(celoEnv, oracleContext)
  )
}

async function upgradeOracleRBACHelmChart(celoEnv: string, oracleContext: string) {
  return upgradeGenericHelmChart(
    celoEnv,
    rbacReleaseName(celoEnv),
    rbacHelmChartPath,
    rbacHelmParameters(celoEnv, oracleContext)
  )
}

function removeOracleRBACHelmRelease(celoEnv: string) {
  return removeGenericHelmChart(rbacReleaseName(celoEnv))
}

function rbacHelmParameters(celoEnv: string,  oracleContext: string) {
  const oracleConfig = getOracleConfig(oracleContext)
  const replicas = oracleConfig.identities.length
  return [`--set environment.name=${celoEnv}`,  `--set oracle.replicas=${replicas}`,]
}

function rbacReleaseName(celoEnv: string) {
  return `${celoEnv}-oracle-rbac`
}

async function rbacServiceAccountSecretNames(celoEnv: string, replicas: number) {
  const names = [...Array(replicas).keys()].map(i => `${rbacReleaseName(celoEnv)}-${i}`)
  const [tokenName] = await execCmdWithExitOnFailure(
    `kubectl get serviceaccount --namespace=${celoEnv} ${names.join(' ')} -o=jsonpath="{.items[*].secrets[0]['name']}"`
  )
  const tokenNames = tokenName.trim().split(' ')
  return tokenNames
}
