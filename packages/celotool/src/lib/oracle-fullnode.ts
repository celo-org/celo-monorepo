import { AKSFullNodeDeploymentConfig, FullNodeDeploymentConfig, installFullNodeChart, removeFullNodeChart, upgradeFullNodeChart } from './aks-fullnode'
import { envVar, fetchEnv } from './env-utils'
import { getAzureClusterConfig, OracleAzureContext } from './oracle'

/**
 * Env vars corresponding to values required for a FullNodeDeploymentConfig
 */
const oracleAzureContextFullNodeDeploymentEnvVars: {
  [key in keyof typeof OracleAzureContext]: { [k in keyof FullNodeDeploymentConfig]: string }
} = {
  [OracleAzureContext.PRIMARY]: {
    diskSizeGb: envVar.ORACLE_PRIMARY_TX_NODES_DISK_SIZE,
    replicas: envVar.ORACLE_PRIMARY_TX_NODES_COUNT,
  },
  [OracleAzureContext.SECONDARY]: {
    diskSizeGb: envVar.ORACLE_SECONDARY_TX_NODES_DISK_SIZE,
    replicas: envVar.ORACLE_SECONDARY_TX_NODES_COUNT,
  },
  TERTIARY: {
    diskSizeGb: envVar.ORACLE_TERTIARY_TX_NODES_DISK_SIZE,
    replicas: envVar.ORACLE_TERTIARY_TX_NODES_COUNT,
  },
}

export async function installOracleFullNodeChart(celoEnv: string, context: OracleAzureContext) {
  return installFullNodeChart(celoEnv, getAKSFullNodeDeploymentConfig(context))
}

export async function upgradeOracleFullNodeChart(celoEnv: string, context: OracleAzureContext, reset: boolean) {
  return upgradeFullNodeChart(celoEnv, getAKSFullNodeDeploymentConfig(context), reset)
}

export async function removeOracleFullNodeChart(celoEnv: string, context: OracleAzureContext) {
  return removeFullNodeChart(celoEnv, getAKSFullNodeDeploymentConfig(context))
}

/**
 * For a given OracleAzureContext, returns the appropriate AKSFullNodeDeploymentConfig
 */
function getAKSFullNodeDeploymentConfig(context: OracleAzureContext): AKSFullNodeDeploymentConfig {
  // @ts-ignore
  const fullNodeDeploymentEnvVars = oracleAzureContextFullNodeDeploymentEnvVars[context]
  const fullNodeDeploymentConfig: FullNodeDeploymentConfig = {
    diskSizeGb: parseInt(fetchEnv(fullNodeDeploymentEnvVars.diskSizeGb), 10),
    replicas: parseInt(fetchEnv(fullNodeDeploymentEnvVars.replicas), 10),
  }
  return {
    clusterConfig: getAzureClusterConfig(context),
    ...fullNodeDeploymentConfig,
  }
}
