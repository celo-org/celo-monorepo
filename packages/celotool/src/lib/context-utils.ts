import { addCeloEnvMiddleware, doCheckOrPromptIfStagingOrProduction, DynamicEnvVar, envVar, fetchEnv, fetchEnvOrFallback, getDynamicEnvVarName } from 'src/lib/env-utils'
import { Argv } from 'yargs'
import { AKSClusterConfig } from './k8s-cluster/aks'
import { AWSClusterConfig } from './k8s-cluster/aws'
import { BaseClusterConfig, BaseClusterManager, CloudProvider } from './k8s-cluster/base'
import { GCPClusterConfig } from './k8s-cluster/gcp'
import { getClusterManager } from './k8s-cluster/utils'

/**
 * Env vars corresponding to each value for the AKSClusterConfig for a particular context
 */
const contextAKSClusterConfigDynamicEnvVars: { [k in keyof Omit<AKSClusterConfig, 'cloudProvider' | 'clusterName' | 'resourceGroup'>]: DynamicEnvVar } = {
  subscriptionId: DynamicEnvVar.AZURE_SUBSCRIPTION_ID,
  tenantId: DynamicEnvVar.AZURE_TENANT_ID,
  regionName: DynamicEnvVar.AZURE_REGION_NAME,
}

/**
 * Env vars corresponding to each value for the Komenci AKSClusterConfig for a particular context
 */
const contextKomenciAKSClusterConfigDynamicEnvVars: { [k in keyof Omit<AKSClusterConfig, 'cloudProvider'>]: DynamicEnvVar } = {
  ...contextAKSClusterConfigDynamicEnvVars,
  clusterName: DynamicEnvVar.KOMENCI_KUBERNETES_CLUSTER_NAME,
  resourceGroup: DynamicEnvVar.KOMENCI_AZURE_KUBERNETES_RESOURCE_GROUP,
}

/**
 * Env vars corresponding to each value for the Oracle AKSClusterConfig for a particular context
 */
const contextOracleAKSClusterConfigDynamicEnvVars: { [k in keyof Omit<AKSClusterConfig, 'cloudProvider'>]: DynamicEnvVar } = {
  ...contextAKSClusterConfigDynamicEnvVars,
  clusterName: DynamicEnvVar.ORACLE_KUBERNETES_CLUSTER_NAME,
  resourceGroup: DynamicEnvVar.ORACLE_AZURE_KUBERNETES_RESOURCE_GROUP,
}

/**
 * Env vars corresponding to each value for the Fullnode AKSClusterConfig for a particular context
 */
const contextFullnodeAKSClusterConfigDynamicEnvVars: { [k in keyof Omit<AKSClusterConfig, 'cloudProvider'>]: DynamicEnvVar } = {
  ...contextAKSClusterConfigDynamicEnvVars,
  clusterName: DynamicEnvVar.FULL_NODES_KUBERNETES_CLUSTER_NAME,
  resourceGroup: DynamicEnvVar.FULL_NODES_AZURE_KUBERNETES_RESOURCE_GROUP,
}

/**
 * Env vars corresponding to each value for the Fullnode AKSClusterConfig for a particular context
 */
const contextFornoAKSClusterConfigDynamicEnvVars: { [k in keyof Omit<AKSClusterConfig, 'cloudProvider'>]: DynamicEnvVar } = {
  ...contextAKSClusterConfigDynamicEnvVars,
  clusterName: DynamicEnvVar.FORNO_KUBERNETES_CLUSTER_NAME,
  resourceGroup: DynamicEnvVar.FORNO_AZURE_KUBERNETES_RESOURCE_GROUP,
}

/**
 * Env vars corresponding to each value for the AWSClusterConfig for a particular context
 */
const contextAWSClusterConfigDynamicEnvVars: { [k in keyof Omit<AWSClusterConfig, 'cloudProvider'>]: DynamicEnvVar } = {
  clusterName: DynamicEnvVar.KUBERNETES_CLUSTER_NAME,
  clusterRegion: DynamicEnvVar.AWS_CLUSTER_REGION,
  resourceGroupTag: DynamicEnvVar.AWS_RESOURCE_GROUP_TAG,
}

/**
 * Env vars corresponding to each value for the GCPClusterConfig for a particular context
 */
const contextGCPClusterConfigDynamicEnvVars: { [k in keyof Omit<GCPClusterConfig, 'cloudProvider'>]: DynamicEnvVar } = {
  clusterName: DynamicEnvVar.KUBERNETES_CLUSTER_NAME,
  projectName: DynamicEnvVar.GCP_PROJECT_NAME,
  zone: DynamicEnvVar.GCP_ZONE,
}

const clusterConfigGetterByCloudProvider: {
  [key in CloudProvider]: (context: string, serviceName?: serviceName) => BaseClusterConfig
} = {
  [CloudProvider.AWS]: getAWSClusterConfig,
  [CloudProvider.AZURE]: getAKSClusterConfig,
  [CloudProvider.GCP]: getGCPClusterConfig,
}

export enum serviceName {
  Oracle,
  Komenci,
  Fullnode,
  Forno
}

export function getCloudProviderFromContext(context: string): CloudProvider {
  for (const cloudProvider of Object.values(CloudProvider)) {
    if (context.startsWith(cloudProvider as string)) {
      return CloudProvider[cloudProvider as keyof typeof CloudProvider]
    }
  }
  throw Error(`Context ${context} must start with one of ${Object.values(CloudProvider)}`)
}

/**
 * Fetches the env vars for a particular context
 * @param context the context to use
 * @return an AKSClusterConfig for the context
 */
export function getAKSClusterConfig(context: string, service?: serviceName): AKSClusterConfig {
  let contextDynamicEnvVars
  switch(service){
    case serviceName.Oracle: {
      contextDynamicEnvVars = contextOracleAKSClusterConfigDynamicEnvVars
      break
    }
    case serviceName.Komenci: {
      contextDynamicEnvVars = contextKomenciAKSClusterConfigDynamicEnvVars
      break
    }
    case serviceName.Fullnode: {
      contextDynamicEnvVars = contextFullnodeAKSClusterConfigDynamicEnvVars
      break
    }
    case serviceName.Forno: {
      contextDynamicEnvVars = contextFornoAKSClusterConfigDynamicEnvVars
      break
    }
    default: {
      throw new Error("Unexpected service name " + serviceName)
    }
  }
  const azureDynamicEnvVars = getContextDynamicEnvVarValues(contextDynamicEnvVars, context)
  const clusterConfig: AKSClusterConfig = {
    cloudProvider: CloudProvider.AZURE,
    ...azureDynamicEnvVars
  }
  return clusterConfig
}

/**
 * Fetches the env vars for a particular context
 * @param context the context to use
 * @return an AWSClusterConfig for the context
 */
export function getAWSClusterConfig(context: string): AWSClusterConfig {
  const awsDynamicEnvVars = getContextDynamicEnvVarValues(contextAWSClusterConfigDynamicEnvVars, context)
  const clusterConfig: AWSClusterConfig = {
    cloudProvider: CloudProvider.AZURE,
    ...awsDynamicEnvVars
  }
  return clusterConfig
}

/**
 * Fetches the env vars for a particular context
 * @param context the context to use
 * @return an AWSClusterConfig for the context
 */
export function getGCPClusterConfig(context: string): GCPClusterConfig {
  const gcpDynamicEnvVars = getContextDynamicEnvVarValues(contextGCPClusterConfigDynamicEnvVars, context)
  const clusterConfig: GCPClusterConfig = {
    cloudProvider: CloudProvider.GCP,
    ...gcpDynamicEnvVars
  }
  return clusterConfig
}

/**
 * Given if the desired context is primary, gives the appropriate OracleAzureContext
 * Gives an object with the values of dynamic environment variables for a context.
 * @param dynamicEnvVars an object whose values correspond to the desired
 *   dynamic env vars to fetch.
 * @param context The context
 * @param defaultValues Optional default values if the dynamic env vars are not found
 * @return an object with the same keys as dynamicEnvVars, but the values are
 *   the values of the dynamic env vars for the particular context
 */
export function getContextDynamicEnvVarValues<T>(
  dynamicEnvVars: { [k in keyof T]: DynamicEnvVar },
  context: string,
  defaultValues?: { [k in keyof T]: string }
): {
  [k in keyof T]: string
} {
  return Object.keys(dynamicEnvVars).reduce(
    (values: any, k: string) => {
      const key = k as keyof T
      const dynamicEnvVar = dynamicEnvVars[key]
      const dynamicEnvVarName = getDynamicEnvVarName(dynamicEnvVar, {
        context
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
 * Reads the context and switches to the appropriate Azure or AWS Cluster
 */
export async function switchToContextCluster(celoEnv: string, context: string, service: serviceName, checkOrPromptIfStagingOrProduction: boolean = true) {
  if (!isValidContext(context)) {
    throw Error(`Invalid context, must be one of ${fetchEnv(envVar.CONTEXTS)}`)
  }
  if (checkOrPromptIfStagingOrProduction) {
    await doCheckOrPromptIfStagingOrProduction()
  }
  const clusterManager: BaseClusterManager = getClusterManagerForContext(celoEnv, context, service)
  return clusterManager.switchToClusterContext()
}

export function getClusterManagerForContext(celoEnv: string, context: string, service: serviceName) {
  const cloudProvider: CloudProvider = getCloudProviderFromContext(context)
  const deploymentConfig = clusterConfigGetterByCloudProvider[cloudProvider](context, service)
  return getClusterManager(cloudProvider, celoEnv, deploymentConfig)
}


/**
 * yargs argv type for an command that requires a context
 */
export interface ContextArgv {
  context: string
}

/**
 * Coerces the value of context to be all upper-case and underscore-separated
 * rather than dash-separated. If the resulting context does not match a regex
 * requiring all caps, alphanumeric, and dash-only characters
 * (must start with letter and not end with an underscore), it will throw.
 */
export function coerceContext(rawContextStr: string) {
  const context = rawContextStr
    .toUpperCase()
    .replace(/-/g, '_')
  if (!RegExp('^[A-Z][A-Z0-9_]*[A-Z0-9]$').test(context)) {
    throw Error(`Invalid context. Raw ${rawContextStr}, implied ${context}`)
  }
  return context
}

export function readableContext(context: string) {
  const readable = context
    .toLowerCase()
    .replace(/_/g, '-')
  if (!RegExp('^[A-Z][A-Z0-9_]*[A-Z0-9]$').test(context)) {
    throw Error(`Invalid context. Context ${context}, readable ${readable}`)
  }
  return readable
}

export function isValidContext(context: string) {
  const validContexts = fetchEnv(envVar.CONTEXTS)
    .split(',')
  const validContextsCoerced = validContexts.map(coerceContext)
  return validContextsCoerced.includes(context)
}

/**
 * Middleware for a context related command.
 * Must be one of the contexts specified in the environment
 * variable CONTEXTS.
 */
export function addContextMiddleware(argv: Argv) {
  return addCeloEnvMiddleware(argv)
    .option('context', {
      description: 'Context to perform the deployment in',
      type: 'string',
    })
    .coerce('context', coerceContext)
}
