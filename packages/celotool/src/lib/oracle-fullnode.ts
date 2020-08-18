import { CloudProvider, FullNodeDeploymentConfig } from './cloud-provider'
import { DynamicEnvVar } from './env-utils'
import { AKSFullNodeDeploymentConfig } from './k8s-fullnode/aks-fullnode'
import { AWSFullNodeDeploymentConfig } from './k8s-fullnode/aws-fullnode'
import { getFullNodeDeployer } from './k8s-fullnode/utils'
import { getOracleContextDynamicEnvVarValues, getAwsClusterConfig, getAzureClusterConfig } from './oracle'

/**
 * Env vars corresponding to values required for a FullNodeDeploymentConfig
 */
const oracleContextFullNodeDeploymentEnvVars: {
  [k in keyof FullNodeDeploymentConfig]: DynamicEnvVar
} = {
  diskSizeGb: DynamicEnvVar.ORACLE_TX_NODES_DISK_SIZE,
  replicas: DynamicEnvVar.ORACLE_TX_NODES_COUNT,
}

const deploymentConfigGetterByCloudProvider: {
  [key in CloudProvider]: (oracleContext: string) => FullNodeDeploymentConfig
} = {
  [CloudProvider.AWS]: getAWSFullNodeDeploymentConfig,
  [CloudProvider.AZURE]: getAKSFullNodeDeploymentConfig,
}

export function getFullNodeDeployerForOracleContext(oracleContext: string) {
  const cloudProvider: CloudProvider = getCloudProviderFromOracleContext(oracleContext)
  const deploymentConfig = deploymentConfigGetterByCloudProvider[cloudProvider](oracleContext)
  return getFullNodeDeployer(cloudProvider, deploymentConfig)
}

function getCloudProviderFromOracleContext(oracleContext: string): CloudProvider {
  for (const cloudProvider of Object.values(CloudProvider)) {
    if (oracleContext.startsWith(cloudProvider as string)) {
      return CloudProvider[cloudProvider as keyof typeof CloudProvider]
    }
  }
  throw Error(`Oracle context ${oracleContext} must start with one of ${Object.values(CloudProvider)}`)
}

export function installOracleFullNodeChart(celoEnv: string, oracleContext: string) {
  const deployer = getFullNodeDeployerForOracleContext(oracleContext)
  return deployer.installChart(celoEnv)
}

export function upgradeOracleFullNodeChart(celoEnv: string, oracleContext: string, reset: boolean) {
  const deployer = getFullNodeDeployerForOracleContext(oracleContext)
  return deployer.upgradeChart(celoEnv, reset)
}

export function removeOracleFullNodeChart(celoEnv: string, oracleContext: string) {
  const deployer = getFullNodeDeployerForOracleContext(oracleContext)
  return deployer.removeChart(celoEnv)
}

/**
 * Returns the base FullNodeDeploymentConfig independent of oracleContext
 */
function getFullNodeDeploymentConfig(oracleContext: string) : FullNodeDeploymentConfig {
  const fullNodeDeploymentEnvVarValues = getOracleContextDynamicEnvVarValues(
    oracleContextFullNodeDeploymentEnvVars,
    oracleContext
  )
  const fullNodeDeploymentConfig: FullNodeDeploymentConfig = {
    diskSizeGb: parseInt(fullNodeDeploymentEnvVarValues.diskSizeGb, 10),
    replicas: parseInt(fullNodeDeploymentEnvVarValues.replicas, 10),
  }
  return fullNodeDeploymentConfig
}

/**
 * For a given OracleAzureContext, returns the appropriate AKSFullNodeDeploymentConfig
 */
function getAKSFullNodeDeploymentConfig(oracleContext: string): AKSFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: FullNodeDeploymentConfig = getFullNodeDeploymentConfig(oracleContext)
  return {
    clusterConfig: getAzureClusterConfig(oracleContext),
    ...fullNodeDeploymentConfig,
  }
}

/**
 * For a given OracleAwsContext, returns the appropriate AKSFullNodeDeploymentConfig
 */
function getAWSFullNodeDeploymentConfig(oracleContext: string): AWSFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: FullNodeDeploymentConfig = getFullNodeDeploymentConfig(oracleContext)
  return {
    clusterConfig: getAwsClusterConfig(oracleContext),
    ...fullNodeDeploymentConfig,
  }
}
