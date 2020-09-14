import { doCheckOrPromptIfStagingOrProduction, DynamicEnvVar, envVar, fetchEnv, fetchEnvOrFallback, getDynamicEnvVarName } from 'src/lib/env-utils'
import { AKSClusterConfig } from './k8s-cluster/aks'
import { AWSClusterConfig } from './k8s-cluster/aws'
import { GCPClusterConfig } from './k8s-cluster/gcp'
import { BaseClusterConfig, BaseClusterManager, CloudProvider } from './k8s-cluster/base'
import { getClusterManager } from './k8s-cluster/utils'

/**
 * Env vars corresponding to each value for the AKSClusterConfig for a particular context
 */

const contextAKSClusterConfigDynamicEnvVars: { [k in keyof Omit<AKSClusterConfig, 'cloudProvider'>]: DynamicEnvVar } = {
  clusterName: DynamicEnvVar.KUBERNETES_CLUSTER_NAME,
  subscriptionId: DynamicEnvVar.AZURE_SUBSCRIPTION_ID,
  tenantId: DynamicEnvVar.AZURE_TENANT_ID,
  resourceGroup: DynamicEnvVar.AZURE_KUBERNETES_RESOURCE_GROUP,
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
  [key in CloudProvider]: (context: string) => BaseClusterConfig
} = {
  [CloudProvider.AWS]: getAWSClusterConfig,
  [CloudProvider.AZURE]: getAKSClusterConfig,
  [CloudProvider.GCP]: getGCPClusterConfig,
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
export function getAKSClusterConfig(context: string): AKSClusterConfig {
  const azureDynamicEnvVars = getContextDynamicEnvVarValues(contextAKSClusterConfigDynamicEnvVars, context)
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
export async function switchToContextCluster(celoEnv: string, context: string, checkOrPromptIfStagingOrProduction = true) {
  if (!isValidContext(context)) {
    throw Error(`Invalid context, must be one of ${fetchEnv(envVar.CONTEXTS)}`)
  }
  if (checkOrPromptIfStagingOrProduction) {
    await doCheckOrPromptIfStagingOrProduction()
  }
  const clusterManager: BaseClusterManager = getClusterManagerForContext(celoEnv, context)
  return clusterManager.switchToClusterContext()
}

function getClusterManagerForContext(celoEnv: string, context: string) {
  const cloudProvider: CloudProvider = getCloudProviderFromContext(context)
  const deploymentConfig = clusterConfigGetterByCloudProvider[cloudProvider](context)
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

export function isValidContext(context: string) {
  const validContexts = fetchEnv(envVar.CONTEXTS)
    .split(',')
  const validContextsCoerced = validContexts.map(coerceContext)
  return validContextsCoerced.includes(context)
}
