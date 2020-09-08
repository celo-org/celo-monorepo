import { DynamicEnvVar } from './env-utils'
import { CloudProvider } from './k8s-cluster/base'
import { AKSFullNodeDeploymentConfig } from './k8s-fullnode/aks'
import { AWSFullNodeDeploymentConfig } from './k8s-fullnode/aws'
import { GCPFullNodeDeploymentConfig } from './k8s-fullnode/gcp'
import { BaseFullNodeDeploymentConfig } from './k8s-fullnode/base'
import { getFullNodeDeployer } from './k8s-fullnode/utils'
import { getAKSClusterConfig, getAWSClusterConfig, getGCPClusterConfig, getOracleContextDynamicEnvVarValues } from './oracle'
import { getCloudProviderFromOracleContext } from './oracle-utils'

/**
 * Env vars corresponding to values required for a BaseFullNodeDeploymentConfig
 */
const oracleContextFullNodeDeploymentEnvVars: {
  [k in keyof BaseFullNodeDeploymentConfig]: DynamicEnvVar
} = {
  diskSizeGb: DynamicEnvVar.ORACLE_TX_NODES_DISK_SIZE,
  replicas: DynamicEnvVar.ORACLE_TX_NODES_COUNT,
}

/**
 * Maps each cloud provider to the correct function to get the appropriate full
 * node deployment config
 */
const deploymentConfigGetterByCloudProvider: {
  [key in CloudProvider]: (oracleContext: string) => BaseFullNodeDeploymentConfig
} = {
  [CloudProvider.AWS]: getAWSFullNodeDeploymentConfig,
  [CloudProvider.AZURE]: getAKSFullNodeDeploymentConfig,
  [CloudProvider.GCP]: getGCPFullNodeDeploymentConfig,
}

/**
 * Gets the appropriate cloud platform's full node deployer given the celoEnv
 * and oracleContext.
 */
export function getFullNodeDeployerForOracleContext(celoEnv: string, oracleContext: string) {
  const cloudProvider: CloudProvider = getCloudProviderFromOracleContext(oracleContext)
  const deploymentConfig = deploymentConfigGetterByCloudProvider[cloudProvider](oracleContext)
  return getFullNodeDeployer(cloudProvider, celoEnv, deploymentConfig)
}

/**
 * Uses the appropriate cloud platform's full node deployer to install the full
 * node chart.
 */
export function installOracleFullNodeChart(celoEnv: string, oracleContext: string) {
  const deployer = getFullNodeDeployerForOracleContext(celoEnv, oracleContext)
  return deployer.installChart()
}

/**
 * Uses the appropriate cloud platform's full node deployer to upgrade the full
 * node chart.
 */
export function upgradeOracleFullNodeChart(celoEnv: string, oracleContext: string, reset: boolean) {
  const deployer = getFullNodeDeployerForOracleContext(celoEnv, oracleContext)
  return deployer.upgradeChart(reset)
}

/**
 * Uses the appropriate cloud platform's full node deployer to remove the full
 * node chart.
 */
export function removeOracleFullNodeChart(celoEnv: string, oracleContext: string) {
  const deployer = getFullNodeDeployerForOracleContext(celoEnv, oracleContext)
  return deployer.removeChart()
}

/**
 * Returns the BaseFullNodeDeploymentConfig that is not specific to a cloud
 * provider for an oracleContext.
 */
function getFullNodeDeploymentConfig(oracleContext: string) : BaseFullNodeDeploymentConfig {
  const fullNodeDeploymentEnvVarValues = getOracleContextDynamicEnvVarValues(
    oracleContextFullNodeDeploymentEnvVars,
    oracleContext
  )
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig = {
    diskSizeGb: parseInt(fullNodeDeploymentEnvVarValues.diskSizeGb, 10),
    replicas: parseInt(fullNodeDeploymentEnvVarValues.replicas, 10),
  }
  return fullNodeDeploymentConfig
}

/**
 * For a given oracleContext, returns the appropriate AKSFullNodeDeploymentConfig
 */
function getAKSFullNodeDeploymentConfig(oracleContext: string): AKSFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig = getFullNodeDeploymentConfig(oracleContext)
  return {
    ...fullNodeDeploymentConfig,
    clusterConfig: getAKSClusterConfig(oracleContext),
  }
}

/**
 * For a given oracleContext, returns the appropriate AWSFullNodeDeploymentConfig
 */
function getAWSFullNodeDeploymentConfig(oracleContext: string): AWSFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig = getFullNodeDeploymentConfig(oracleContext)
  return {
    ...fullNodeDeploymentConfig,
    clusterConfig: getAWSClusterConfig(oracleContext),
  }
}

/**
 * For a given oracleContext, returns the appropriate getGCPFullNodeDeploymentConfig
 */
function getGCPFullNodeDeploymentConfig(oracleContext: string): GCPFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig = getFullNodeDeploymentConfig(oracleContext)
  return {
    ...fullNodeDeploymentConfig,
    clusterConfig: getGCPClusterConfig(oracleContext),
  }
}
