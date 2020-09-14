import { DynamicEnvVar } from './env-utils'
import { CloudProvider } from './k8s-cluster/base'
import { AKSFullNodeDeploymentConfig } from './k8s-fullnode/aks'
import { AWSFullNodeDeploymentConfig } from './k8s-fullnode/aws'
import { GCPFullNodeDeploymentConfig } from './k8s-fullnode/gcp'
import { BaseFullNodeDeploymentConfig } from './k8s-fullnode/base'
import { getFullNodeDeployer } from './k8s-fullnode/utils'
import { getAKSClusterConfig, getAWSClusterConfig, getGCPClusterConfig, getContextDynamicEnvVarValues } from './context-utils'
import { getCloudProviderFromContext } from './context-utils'

/**
 * Env vars corresponding to values required for a BaseFullNodeDeploymentConfig
 */
const contextFullNodeDeploymentEnvVars: {
  [k in keyof BaseFullNodeDeploymentConfig]: DynamicEnvVar
} = {
  diskSizeGb: DynamicEnvVar.FULL_NODES_DISK_SIZE,
  replicas: DynamicEnvVar.FULL_NODES_COUNT,
}

/**
 * Maps each cloud provider to the correct function to get the appropriate full
 * node deployment config
 */
const deploymentConfigGetterByCloudProvider: {
  [key in CloudProvider]: (context: string) => BaseFullNodeDeploymentConfig
} = {
  [CloudProvider.AWS]: getAWSFullNodeDeploymentConfig,
  [CloudProvider.AZURE]: getAKSFullNodeDeploymentConfig,
  [CloudProvider.GCP]: getGCPFullNodeDeploymentConfig,
}

/**
 * Gets the appropriate cloud platform's full node deployer given the celoEnv
 * and context.
 */
export function getFullNodeDeployerForContext(celoEnv: string, context: string) {
  const cloudProvider: CloudProvider = getCloudProviderFromContext(context)
  const deploymentConfig = deploymentConfigGetterByCloudProvider[cloudProvider](context)
  return getFullNodeDeployer(cloudProvider, celoEnv, deploymentConfig)
}

/**
 * Uses the appropriate cloud platform's full node deployer to install the full
 * node chart.
 */
export function installFullNodeChart(celoEnv: string, context: string) {
  const deployer = getFullNodeDeployerForContext(celoEnv, context)
  return deployer.installChart()
}

/**
 * Uses the appropriate cloud platform's full node deployer to upgrade the full
 * node chart.
 */
export function upgradeFullNodeChart(celoEnv: string, context: string, reset: boolean) {
  const deployer = getFullNodeDeployerForContext(celoEnv, context)
  return deployer.upgradeChart(reset)
}

/**
 * Uses the appropriate cloud platform's full node deployer to remove the full
 * node chart.
 */
export function removeFullNodeChart(celoEnv: string, context: string) {
  const deployer = getFullNodeDeployerForContext(celoEnv, context)
  return deployer.removeChart()
}

/**
 * Returns the BaseFullNodeDeploymentConfig that is not specific to a cloud
 * provider for a context.
 */
function getFullNodeDeploymentConfig(context: string) : BaseFullNodeDeploymentConfig {
  const fullNodeDeploymentEnvVarValues = getContextDynamicEnvVarValues(
    contextFullNodeDeploymentEnvVars,
    context
  )
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig = {
    diskSizeGb: parseInt(fullNodeDeploymentEnvVarValues.diskSizeGb, 10),
    replicas: parseInt(fullNodeDeploymentEnvVarValues.replicas, 10),
  }
  return fullNodeDeploymentConfig
}

/**
 * For a given context, returns the appropriate AKSFullNodeDeploymentConfig
 */
function getAKSFullNodeDeploymentConfig(context: string): AKSFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig = getFullNodeDeploymentConfig(context)
  return {
    ...fullNodeDeploymentConfig,
    clusterConfig: getAKSClusterConfig(context),
  }
}

/**
 * For a given context, returns the appropriate AWSFullNodeDeploymentConfig
 */
function getAWSFullNodeDeploymentConfig(context: string): AWSFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig = getFullNodeDeploymentConfig(context)
  return {
    ...fullNodeDeploymentConfig,
    clusterConfig: getAWSClusterConfig(context),
  }
}

/**
 * For a given context, returns the appropriate getGCPFullNodeDeploymentConfig
 */
function getGCPFullNodeDeploymentConfig(context: string): GCPFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig = getFullNodeDeploymentConfig(context)
  return {
    ...fullNodeDeploymentConfig,
    clusterConfig: getGCPClusterConfig(context),
  }
}
