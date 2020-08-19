import { CloudProvider } from './cloud-provider'
import { DynamicEnvVar } from './env-utils'
import { AKSFullNodeDeploymentConfig } from './k8s-fullnode/aks'
import { AWSFullNodeDeploymentConfig } from './k8s-fullnode/aws'
import { BaseFullNodeDeploymentConfig } from './k8s-fullnode/base'
import { getFullNodeDeployer } from './k8s-fullnode/utils'
import { getOracleContextDynamicEnvVarValues, getAWSClusterConfig, getAzureClusterConfig } from './oracle'
import { getCloudProviderFromOracleContext } from './oracle/utils'

/**
 * Env vars corresponding to values required for a FullNodeDeploymentConfig
 */
const oracleContextFullNodeDeploymentEnvVars: {
  [k in keyof BaseFullNodeDeploymentConfig]: DynamicEnvVar
} = {
  diskSizeGb: DynamicEnvVar.ORACLE_TX_NODES_DISK_SIZE,
  replicas: DynamicEnvVar.ORACLE_TX_NODES_COUNT,
}

const deploymentConfigGetterByCloudProvider: {
  [key in CloudProvider]: (oracleContext: string) => BaseFullNodeDeploymentConfig
} = {
  [CloudProvider.AWS]: getAWSFullNodeDeploymentConfig,
  [CloudProvider.AZURE]: getAKSFullNodeDeploymentConfig,
}

export function getFullNodeDeployerForOracleContext(celoEnv: string, oracleContext: string) {
  const cloudProvider: CloudProvider = getCloudProviderFromOracleContext(oracleContext)
  const deploymentConfig = deploymentConfigGetterByCloudProvider[cloudProvider](oracleContext)
  return getFullNodeDeployer(cloudProvider, celoEnv, deploymentConfig)
}

export function installOracleFullNodeChart(celoEnv: string, oracleContext: string) {
  const deployer = getFullNodeDeployerForOracleContext(celoEnv, oracleContext)
  return deployer.installChart()
}

export function upgradeOracleFullNodeChart(celoEnv: string, oracleContext: string, reset: boolean) {
  const deployer = getFullNodeDeployerForOracleContext(oracleContext, celoEnv)
  return deployer.upgradeChart(reset)
}

export function removeOracleFullNodeChart(celoEnv: string, oracleContext: string) {
  const deployer = getFullNodeDeployerForOracleContext(oracleContext, celoEnv)
  return deployer.removeChart()
}

/**
 * Returns the base FullNodeDeploymentConfig independent of oracleContext
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
 * For a given OracleAzureContext, returns the appropriate AKSFullNodeDeploymentConfig
 */
function getAKSFullNodeDeploymentConfig(oracleContext: string): AKSFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig = getFullNodeDeploymentConfig(oracleContext)
  return {
    clusterConfig: getAzureClusterConfig(oracleContext),
    ...fullNodeDeploymentConfig,
  }
}

/**
 * For a given OracleAwsContext, returns the appropriate AKSFullNodeDeploymentConfig
 */
function getAWSFullNodeDeploymentConfig(oracleContext: string): AWSFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig = getFullNodeDeploymentConfig(oracleContext)
  return {
    clusterConfig: getAWSClusterConfig(oracleContext),
    ...fullNodeDeploymentConfig,
  }
}
