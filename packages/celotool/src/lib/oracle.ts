import {
  AzureClusterConfig,
  createIdentityIfNotExists,
  deleteIdentity,
  getIdentity,
  switchToCluster,
} from 'src/lib/azure'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { getFornoUrl, getFullNodeRpcInternalUrl } from 'src/lib/endpoints'
import { addCeloEnvMiddleware, envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
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
 * Represents the identity of a single oracle
 */
interface OracleIdentity {
  address: string
  keyVaultName: string
  azureIdentityName: string
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
const oracleAzureContextOracleConfigEnvVars: {
  [key in keyof typeof OracleAzureContext]: { [k in keyof OracleConfig]: string }
} = {
  [OracleAzureContext.PRIMARY]: {
    identities: envVar.ORACLE_PRIMARY_ADDRESS_AZURE_KEY_VAULTS,
  },
  [OracleAzureContext.SECONDARY]: {
    identities: envVar.ORACLE_SECONDARY_ADDRESS_AZURE_KEY_VAULTS,
  },
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-oracle`
}

export async function installHelmChart(
  celoEnv: string,
  context: OracleAzureContext,
  useFullNodes: boolean
) {
  // First install the oracle-rbac helm chart.
  // This must be deployed before so we can use a resulting auth token so that
  // oracle pods can reach the K8s API server to change their aad labels
  await installOracleRBACHelmChart(celoEnv)
  // Then install the oracle helm chart
  return installGenericHelmChart(
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
    await deleteOracleAzureIdentity(context, identity)
  }
}

async function helmParameters(celoEnv: string, context: OracleAzureContext, useFullNodes: boolean) {
  const oracleConfig = getOracleConfig(context)

  const kubeAuthTokenName = await rbacAuthTokenName(celoEnv)
  const replicas = oracleConfig.identities.length
  const rpcProviderUrl = useFullNodes ? getFullNodeRpcInternalUrl(celoEnv) : getFornoUrl(celoEnv)
  return [
    `--set environment.name=${celoEnv}`,
    `--set image.repository=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set image.tag=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_TAG)}`,
    `--set kube.authTokenName=${kubeAuthTokenName}`,
    `--set oracle.azureHsm.initTryCount=5`,
    `--set oracle.azureHsm.initMaxRetryBackoffMs=30000`,
    `--set oracle.replicas=${replicas}`,
    `--set oracle.rpcProviderUrl=${rpcProviderUrl}`,
    `--set oracle.metrics.enabled=true`,
    `--set oracle.metrics.prometheusPort=9090`,
  ].concat(await oracleIdentityHelmParameters(context, oracleConfig))
}

async function oracleIdentityHelmParameters(
  context: OracleAzureContext,
  oracleConfig: OracleConfig
) {
  const replicas = oracleConfig.identities.length
  let params: string[] = []
  for (let i = 0; i < replicas; i++) {
    const oracleIdentity = oracleConfig.identities[i]
    const azureIdentity = await createOracleAzureIdentityIfNotExists(context, oracleIdentity)
    const prefix = `--set oracle.identities[${i}]`
    params = params.concat([
      `${prefix}.address=${oracleIdentity.address}`,
      `${prefix}.azure.id=${azureIdentity.id}`,
      `${prefix}.azure.clientId=${azureIdentity.clientId}`,
      `${prefix}.azure.keyVaultName=${oracleIdentity.keyVaultName}`,
    ])
  }
  return params
}

async function createOracleAzureIdentityIfNotExists(
  context: OracleAzureContext,
  oracleIdentity: OracleIdentity
) {
  const clusterConfig = getAzureClusterConfig(context)
  const identity = await createIdentityIfNotExists(clusterConfig, oracleIdentity.azureIdentityName)

  // Grant the service principal permission to manage the oracle identity.
  // See: https://github.com/Azure/aad-pod-identity#6-set-permissions-for-mic
  const [rawServicePrincipalClientId] = await execCmdWithExitOnFailure(
    `az aks show -n ${clusterConfig.clusterName} --query servicePrincipalProfile.clientId -g ${clusterConfig.resourceGroup} -o tsv`
  )
  const servicePrincipalClientId = rawServicePrincipalClientId.trim()
  await execCmdWithExitOnFailure(
    `az role assignment create --role "Managed Identity Operator" --assignee ${servicePrincipalClientId} --scope ${identity.id}`
  )
  // Allow the oracle identity to access the correct key vault
  await setOracleKeyVaultPolicy(clusterConfig, oracleIdentity, identity)
  return identity
}

async function setOracleKeyVaultPolicy(
  clusterConfig: AzureClusterConfig,
  oracleIdentity: OracleIdentity,
  azureIdentity: any
) {
  return execCmdWithExitOnFailure(
    `az keyvault set-policy --name ${oracleIdentity.keyVaultName} --key-permissions {get,list,sign} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
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
  return deleteIdentity(clusterConfig, oracleIdentity.azureIdentityName)
}

async function deleteOracleKeyVaultPolicy(
  clusterConfig: AzureClusterConfig,
  oracleIdentity: OracleIdentity
) {
  const azureIdentity = await getIdentity(clusterConfig, oracleIdentity.azureIdentityName)
  return execCmdWithExitOnFailure(
    `az keyvault delete-policy --name ${oracleIdentity.keyVaultName} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
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
 * Decodes the identities env variable for a particular context of the form:
 * <address>:<keyVaultName>,<address>:<keyVaultName>
 * eg: 0x0000000000000000000000000000000000000000:keyVault0,0x0000000000000000000000000000000000000001:keyVault1
 * into an array of OracleIdentity in the same order
 */
function getOracleIdentities(context: OracleAzureContext): OracleIdentity[] {
  const identityStrings = fetchEnv(oracleAzureContextOracleConfigEnvVars[context].identities).split(
    ','
  )
  const identities = []
  for (const identityStr of identityStrings) {
    const [address, keyVaultName] = identityStr.split(':')
    if (!address || !keyVaultName) {
      throw Error(
        `Address or key vault name is invalid. Address: ${address} Key Vault Name: ${keyVaultName}`
      )
    }
    identities.push({
      azureIdentityName: getOracleAzureIdentityName(keyVaultName, address),
      address,
      keyVaultName,
    })
  }
  return identities
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

async function installOracleRBACHelmChart(celoEnv: string) {
  return installGenericHelmChart(
    celoEnv,
    rbacReleaseName(celoEnv),
    rbacHelmChartPath,
    rbacHelmParameters(celoEnv)
  )
}

function removeOracleRBACHelmRelease(celoEnv: string) {
  return removeGenericHelmChart(rbacReleaseName(celoEnv))
}

function rbacHelmParameters(celoEnv: string) {
  return [`--set environment.name=${celoEnv}`]
}

function rbacReleaseName(celoEnv: string) {
  return `${celoEnv}-oracle-rbac`
}

async function rbacAuthTokenName(celoEnv: string) {
  const [tokenName] = await execCmdWithExitOnFailure(
    `kubectl get serviceaccount --namespace=${celoEnv} ${rbacReleaseName(
      celoEnv
    )} -o=jsonpath="{.secrets[0]['name']}"`
  )
  return tokenName.trim()
}
