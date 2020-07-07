import { ensureLeading0x, privateKeyToAddress } from '@celo/utils/src/address'
import { assignRoleIfNotAssigned, AzureClusterConfig, createIdentityIfNotExists, deleteIdentity, getAKSManagedServiceIdentityObjectId, getAKSServicePrincipalObjectId, getIdentity, switchToCluster } from 'src/lib/azure'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { getFornoUrl, getFullNodeHttpRpcInternalUrl, getFullNodeWebSocketRpcInternalUrl } from 'src/lib/endpoints'
import { addCeloEnvMiddleware, envVar, fetchEnv, fetchEnvOrFallback } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
import { installGenericHelmChart, removeGenericHelmChart, upgradeGenericHelmChart } from 'src/lib/helm_deploy'
import yargs from 'yargs'

const helmChartPath = '../helm-charts/oracle'
const rbacHelmChartPath = '../helm-charts/oracle-rbac'

/**
 * Each context is a separate AKS cluster
 */
export enum OracleAzureContext {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
}

/**
 * Contains information needed when using Azure HSM signing
 */
interface OracleAzureHsmIdentity {
  identityName: string
  keyVaultName: string
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
const oracleAzureContextClusterConfigEnvVars: {
  [key in keyof typeof OracleAzureContext]: { [k in keyof AzureClusterConfig]: string }
} = {
  [OracleAzureContext.PRIMARY]: {
    subscriptionId: envVar.ORACLE_PRIMARY_AZURE_SUBSCRIPTION_ID,
    tenantId: envVar.ORACLE_PRIMARY_AZURE_TENANT_ID,
    resourceGroup: envVar.ORACLE_PRIMARY_AZURE_KUBERNETES_RESOURCE_GROUP,
    clusterName: envVar.ORACLE_PRIMARY_AZURE_KUBERNETES_CLUSTER_NAME,
  },
  [OracleAzureContext.SECONDARY]: {
    subscriptionId: envVar.ORACLE_SECONDARY_AZURE_SUBSCRIPTION_ID,
    tenantId: envVar.ORACLE_SECONDARY_AZURE_TENANT_ID,
    resourceGroup: envVar.ORACLE_SECONDARY_AZURE_KUBERNETES_RESOURCE_GROUP,
    clusterName: envVar.ORACLE_SECONDARY_AZURE_KUBERNETES_CLUSTER_NAME,
  },
}

/**
 * Env vars corresponding to each value for the OracleConfig for a particular context
 */
const oracleAzureContextOracleIdentityEnvVars: {
  [key in keyof typeof OracleAzureContext]: {
    addressAzureKeyVaults: string,
    addressesFromMnemonicCount: string,
  }
} = {
  [OracleAzureContext.PRIMARY]: {
    addressAzureKeyVaults: envVar.ORACLE_PRIMARY_ADDRESS_AZURE_KEY_VAULTS,
    addressesFromMnemonicCount: envVar.ORACLE_PRIMARY_ADDRESSES_FROM_MNEMONIC_COUNT,
  },
  [OracleAzureContext.SECONDARY]: {
    addressAzureKeyVaults: envVar.ORACLE_SECONDARY_ADDRESS_AZURE_KEY_VAULTS,
    addressesFromMnemonicCount: envVar.ORACLE_SECONDARY_ADDRESSES_FROM_MNEMONIC_COUNT,
  },
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-oracle`
}

export async function installHelmChart(
  celoEnv: string,
  context: OracleAzureContext,
  useForno: boolean
) {
  // First install the oracle-rbac helm chart.
  // This must be deployed before so we can use a resulting auth token so that
  // oracle pods can reach the K8s API server to change their aad labels
  await installOracleRBACHelmChart(celoEnv, context)
  // Then install the oracle helm chart
  return installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv, context, useForno)
  )
}

export async function upgradeOracleChart(
  celoEnv: string,
  context: OracleAzureContext,
  useFullNodes: boolean
) {
  await upgradeOracleRBACHelmChart(celoEnv, context)
  return upgradeGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv, context, useFullNodes)
  )
}

export async function removeHelmRelease(celoEnv: string, context: OracleAzureContext) {
  await removeGenericHelmChart(releaseName(celoEnv))
  await removeOracleRBACHelmRelease(celoEnv)
  const oracleConfig = getOracleConfig(context)
  for (const identity of oracleConfig.identities) {
    // If the identity is using Azure HSM signing, clean it up too
    if (identity.azureHsmIdentity) {
      await deleteOracleAzureIdentity(context, identity)
    }
  }
}

async function helmParameters(celoEnv: string, context: OracleAzureContext, useForno: boolean) {
  const oracleConfig = getOracleConfig(context)

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
  ].concat(await oracleIdentityHelmParameters(context, oracleConfig))
}

/**
 * Returns an array of helm command line parameters for the oracle identities.
 * Supports both private key and Azure HSM signing.
 */
async function oracleIdentityHelmParameters(
  context: OracleAzureContext,
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
      const azureIdentity = await createOracleAzureIdentityIfNotExists(context, oracleIdentity)
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
  context: OracleAzureContext,
  oracleIdentity: OracleIdentity
) {
  const clusterConfig = getAzureClusterConfig(context)
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
  const [keyVaultPoliciesStr] = await execCmdWithExitOnFailure(
    `az keyvault show --name ${oracleIdentity.azureHsmIdentity!.keyVaultName} -g ${clusterConfig.resourceGroup} --query "properties.accessPolicies[?objectId == '${azureIdentity.principalId}' && sort(permissions.keys) == [${keyPermissions.map(perm => `'${perm}'`).join(', ')}]]"`
  )
  const keyVaultPolicies = JSON.parse(keyVaultPoliciesStr)
  if (keyVaultPolicies.length) {
    console.info(`Skipping setting key permissions, ${keyPermissions.join(' ')} already set for vault ${oracleIdentity.azureHsmIdentity!.keyVaultName} and identity objectId ${azureIdentity.principalId}`)
    return
  }
  console.info(`Setting key permissions ${keyPermissions.join(' ')} for vault ${oracleIdentity.azureHsmIdentity!.keyVaultName} and identity objectId ${azureIdentity.principalId}`)
  return execCmdWithExitOnFailure(
    `az keyvault set-policy --name ${oracleIdentity.azureHsmIdentity!.keyVaultName} --key-permissions ${keyPermissions.join(' ')} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
  )
}

/**
 * deleteOracleAzureIdentity deletes the key vault policy and the oracle's managed identity
 */
async function deleteOracleAzureIdentity(
  context: OracleAzureContext,
  oracleIdentity: OracleIdentity
) {
  const clusterConfig = getAzureClusterConfig(context)
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
function getOracleConfig(context: OracleAzureContext): OracleConfig {
  return {
    identities: getOracleIdentities(context),
  }
}


/**
 * Returns an array of oracle identities. If the Azure Key Vault env var is specified,
 * the identities are created from that. Otherwise, the identities are created
 * with private keys generated by the mnemonic.
 */
function getOracleIdentities(context: OracleAzureContext): OracleIdentity[] {
  const oracleIdentityEnvVars = oracleAzureContextOracleIdentityEnvVars[context]
  const addressAzureKeyVaults = fetchEnvOrFallback(oracleIdentityEnvVars.addressAzureKeyVaults, '')
  const addressesFromMnemonicCount = fetchEnvOrFallback(oracleIdentityEnvVars.addressesFromMnemonicCount, '')
  // Give priority to key vault
  if (addressAzureKeyVaults) {
    return getAzureHsmOracleIdentities(addressAzureKeyVaults)
  } else if (addressesFromMnemonicCount) {
    const addressesFromMnemonicCountNum = parseInt(addressesFromMnemonicCount, 10)
    return getMnemonicBasedOracleIdentities(addressesFromMnemonicCountNum)
  }

  throw Error(`None of the following env vars are specified: ${Object.keys(oracleIdentityEnvVars)}`)
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
    const [address, keyVaultName] = identityStr.split(':')
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
 * @param context the OracleAzureContext to use
 * @return an AzureClusterConfig for the context
 */
export function getAzureClusterConfig(context: OracleAzureContext): AzureClusterConfig {
  const configEnvVars = oracleAzureContextClusterConfigEnvVars[context]
  const clusterConfig: AzureClusterConfig = {
    subscriptionId: '',
    tenantId: '',
    resourceGroup: '',
    clusterName: '',
  }
  for (const k of Object.keys(configEnvVars)) {
    const key = k as keyof AzureClusterConfig
    clusterConfig[key] = fetchEnv(configEnvVars[key])
  }
  return clusterConfig
}

/**
 * Given if the desired context is primary, gives the appropriate OracleAzureContext
 */
export function getOracleAzureContext(primary: boolean): OracleAzureContext {
  return primary ? OracleAzureContext.PRIMARY : OracleAzureContext.SECONDARY
}

/**
 * Switches to the AKS cluster associated with the given context
 */
export function switchToAzureContextCluster(celoEnv: string, context: OracleAzureContext) {
  const azureClusterConfig = getAzureClusterConfig(context)
  return switchToCluster(celoEnv, azureClusterConfig)
}

/**
 * yargs argv type for an oracle related command.
 */
export interface OracleArgv {
  primary: boolean
  secondary: boolean
}

/**
 * Middleware for an oracle related command.
 * One of primary or secondary must be true, but not both.
 * Instead of relying on one boolean, the two booleans are used to give the commands
 * a more explicit cleaner interface.
 */
export function addOracleMiddleware(argv: yargs.Argv) {
  return addCeloEnvMiddleware(argv)
    .option('primary', {
      description: 'Targets the primary oracle k8s cluster',
      default: false,
      type: 'boolean',
    })
    .option('secondary', {
      description: 'Targets the secondary oracle k8s cluster',
      default: false,
      type: 'boolean',
    })
    .check((oracleArgv: OracleArgv) => {
      if (oracleArgv.primary === oracleArgv.secondary) {
        throw Error('Exactly one of `primary` and `secondary` must be true')
      }
      return true
    })
}

// Oracle RBAC------
// We need the oracle pods to be able to change their label to accommodate
// limitations in aad-pod-identity & statefulsets (see https://github.com/Azure/aad-pod-identity/issues/237#issuecomment-611672987)
// To do this, we use an auth token that we get using the resources in the `oracle-rbac` chart

async function installOracleRBACHelmChart(celoEnv: string, context: OracleAzureContext) {
  return installGenericHelmChart(
    celoEnv,
    rbacReleaseName(celoEnv),
    rbacHelmChartPath,
    rbacHelmParameters(celoEnv, context)
  )
}

async function upgradeOracleRBACHelmChart(celoEnv: string, context: OracleAzureContext) {
  return upgradeGenericHelmChart(
    celoEnv,
    rbacReleaseName(celoEnv),
    rbacHelmChartPath,
    rbacHelmParameters(celoEnv, context)
  )
}

function removeOracleRBACHelmRelease(celoEnv: string) {
  return removeGenericHelmChart(rbacReleaseName(celoEnv))
}

function rbacHelmParameters(celoEnv: string,  context: OracleAzureContext) {
  const oracleConfig = getOracleConfig(context)
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
