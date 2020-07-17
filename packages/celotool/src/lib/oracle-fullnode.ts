import { AWSFullNodeDeploymentConfig, installAWSFullNodeChart, removeAWSFullNodeChart, upgradeAWSFullNodeChart } from 'src/lib/aws-fullnode'
import { FullNodeDeploymentConfig } from 'src/lib/cloud-provider'
import { AKSFullNodeDeploymentConfig, installAKSFullNodeChart, removeAKSFullNodeChart, upgradeAKSFullNodeChart } from './aks-fullnode'
import { DynamicEnvVar } from './env-utils'
import { getAwsClusterConfig, getAzureClusterConfig, getOracleContextDynamicEnvVarValues } from './oracle'

/**
 * Env vars corresponding to values required for a FullNodeDeploymentConfig
 */
const oracleContextFullNodeDeploymentEnvVars: {
  [k in keyof FullNodeDeploymentConfig]: DynamicEnvVar
} = {
  diskSizeGb: DynamicEnvVar.ORACLE_TX_NODES_DISK_SIZE,
  replicas: DynamicEnvVar.ORACLE_TX_NODES_COUNT,
}

export async function installOracleFullNodeChart(celoEnv: string, oracleContext: string) {
  return oracleContext.startsWith('AWS') ? 
  installAWSFullNodeChart(celoEnv, getAWSFullNodeDeploymentConfig(oracleContext)) : 
  installAKSFullNodeChart(celoEnv, getAKSFullNodeDeploymentConfig(oracleContext))
}

export async function upgradeOracleFullNodeChart(celoEnv: string, oracleContext: string, reset: boolean) {
  return oracleContext.startsWith('AWS') ? 
  upgradeAWSFullNodeChart(celoEnv, getAWSFullNodeDeploymentConfig(oracleContext), reset) : 
  upgradeAKSFullNodeChart(celoEnv, getAKSFullNodeDeploymentConfig(oracleContext), reset)
}

export async function removeOracleFullNodeChart(celoEnv: string, oracleContext: string) {
  return oracleContext.startsWith('AWS') ? 
  removeAWSFullNodeChart(celoEnv, getAWSFullNodeDeploymentConfig(oracleContext)) : 
  removeAKSFullNodeChart(celoEnv, getAKSFullNodeDeploymentConfig(oracleContext))
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
