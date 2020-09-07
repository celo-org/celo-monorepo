import { AKSFullNodeDeploymentConfig, FullNodeDeploymentConfig, installFullNodeChart, removeFullNodeChart, upgradeFullNodeChart } from './aks-fullnode'
import { DynamicEnvVar } from './env-utils'
import { getAzureClusterConfig, getOracleContextDynamicEnvVarValues } from './oracle'

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
  return installFullNodeChart(celoEnv, getAKSFullNodeDeploymentConfig(oracleContext))
}

export async function upgradeOracleFullNodeChart(celoEnv: string, oracleContext: string, reset: boolean) {
  return upgradeFullNodeChart(celoEnv, getAKSFullNodeDeploymentConfig(oracleContext), reset)
}

export async function removeOracleFullNodeChart(celoEnv: string, oracleContext: string) {
  return removeFullNodeChart(celoEnv, getAKSFullNodeDeploymentConfig(oracleContext))
}

/**
 * For a given OracleAzureContext, returns the appropriate AKSFullNodeDeploymentConfig
 */
function getAKSFullNodeDeploymentConfig(oracleContext: string): AKSFullNodeDeploymentConfig {
  const fullNodeDeploymentEnvVarValues = getOracleContextDynamicEnvVarValues(
    oracleContextFullNodeDeploymentEnvVars,
    oracleContext
  )
  const fullNodeDeploymentConfig: FullNodeDeploymentConfig = {
    diskSizeGb: parseInt(fullNodeDeploymentEnvVarValues.diskSizeGb, 10),
    replicas: parseInt(fullNodeDeploymentEnvVarValues.replicas, 10),
  }
  return {
    clusterConfig: getAzureClusterConfig(oracleContext),
    ...fullNodeDeploymentConfig,
  }
}
