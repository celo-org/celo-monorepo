import stringHash from 'string-hash'
import {
  getAksClusterConfig,
  getAwsClusterConfig,
  getCloudProviderFromContext,
  getContextDynamicEnvVarValues,
  getGCPClusterConfig,
} from './context-utils'
import { DynamicEnvVar, envVar, fetchEnv, getDynamicEnvVarValue } from './env-utils'
import { CloudProvider } from './k8s-cluster/base'
import { AksFullNodeDeploymentConfig } from './k8s-fullnode/aks'
import { AwsFullNodeDeploymentConfig } from './k8s-fullnode/aws'
import { BaseFullNodeDeploymentConfig } from './k8s-fullnode/base'
import { GCPFullNodeDeploymentConfig } from './k8s-fullnode/gcp'
import { getFullNodeDeployer } from './k8s-fullnode/utils'
import { uploadStaticNodesToGoogleStorage } from './testnet-utils'

/**
 * Env vars corresponding to values required for a BaseFullNodeDeploymentConfig
 */
const contextFullNodeDeploymentEnvVars: {
  [k in keyof BaseFullNodeDeploymentConfig]: DynamicEnvVar
} = {
  diskSizeGb: DynamicEnvVar.FULL_NODES_DISK_SIZE,
  replicas: DynamicEnvVar.FULL_NODES_COUNT,
  rollingUpdatePartition: DynamicEnvVar.FULL_NODES_ROLLING_UPDATE_PARTITION,
  rpcApis: DynamicEnvVar.FULL_NODES_RPC_API_METHODS,
  gcMode: DynamicEnvVar.FULL_NODES_GETH_GC_MODE,
  wsPort: DynamicEnvVar.FULL_NODES_WS_PORT,
  useGstoreData: DynamicEnvVar.FULL_NODES_USE_GSTORAGE_DATA,
}

/**
 * Maps each cloud provider to the correct function to get the appropriate full
 * node deployment config
 */
const deploymentConfigGetterByCloudProvider: {
  [key in CloudProvider]: (context: string) => BaseFullNodeDeploymentConfig
} = {
  [CloudProvider.AWS]: getAwsFullNodeDeploymentConfig,
  [CloudProvider.AZURE]: getAksFullNodeDeploymentConfig,
  [CloudProvider.GCP]: getGCPFullNodeDeploymentConfig,
}

/**
 * Gets the appropriate cloud platform's full node deployer given the celoEnv
 * and context.
 */
export function getFullNodeDeployerForContext(
  celoEnv: string,
  context: string,
  generateNodeKeys: boolean,
  createNEG: boolean
) {
  const cloudProvider: CloudProvider = getCloudProviderFromContext(context)
  let deploymentConfig = deploymentConfigGetterByCloudProvider[cloudProvider](context)
  if (generateNodeKeys) {
    deploymentConfig = {
      ...deploymentConfig,
      nodeKeyGenerationInfo: {
        mnemonic: fetchEnv(envVar.MNEMONIC),
        derivationIndex: stringHash(getNodeKeyDerivationString(context)),
      },
    }
  }
  if (createNEG) {
    if (cloudProvider !== CloudProvider.GCP) {
      throw Error('Cannot create NEG for cloud providers other than GCP')
    }
    deploymentConfig = {
      ...deploymentConfig,
      createNEG: true,
    } as unknown as GCPFullNodeDeploymentConfig // make typescript happy
  }
  return getFullNodeDeployer(cloudProvider, celoEnv, deploymentConfig)
}

/**
 * Uses the appropriate cloud platform's full node deployer to install the full
 * node chart.
 */
export async function installFullNodeChart(
  celoEnv: string,
  context: string,
  staticNodes: boolean = false,
  createNEG: boolean = false
) {
  const deployer = getFullNodeDeployerForContext(celoEnv, context, staticNodes, createNEG)
  const enodes = await deployer.installChart(context)
  if (enodes) {
    await uploadStaticNodeEnodes(celoEnv, context, enodes)
  }
}

/**
 * Uses the appropriate cloud platform's full node deployer to upgrade the full
 * node chart.
 */
export async function upgradeFullNodeChart(
  celoEnv: string,
  context: string,
  reset: boolean,
  generateNodeKeys: boolean = false,
  createNEG: boolean = false
) {
  const deployer = getFullNodeDeployerForContext(celoEnv, context, generateNodeKeys, createNEG)
  const enodes = await deployer.upgradeChart(context, reset)
  if (enodes) {
    await uploadStaticNodeEnodes(celoEnv, context, enodes)
  }
}

/**
 * Uses the appropriate cloud platform's full node deployer to remove the full
 * node chart.
 */
export async function removeFullNodeChart(celoEnv: string, context: string) {
  const deployer = getFullNodeDeployerForContext(celoEnv, context, false, false)
  await deployer.removeChart()
  // Remove any previous static nodes
  await uploadStaticNodeEnodes(celoEnv, context, [])
}

function uploadStaticNodeEnodes(celoEnv: string, context: string, enodes: string[]) {
  const suffix = getStaticNodesFileSuffix(context)
  // Use mainnet instead of rc1
  const env = celoEnv === 'rc1' ? 'mainnet' : celoEnv
  return uploadStaticNodesToGoogleStorage(`${env}.${suffix}`, enodes)
}

function getNodeKeyDerivationString(context: string) {
  return getDynamicEnvVarValue(DynamicEnvVar.FULL_NODES_NODEKEY_DERIVATION_STRING, {
    context,
  })
}

function getStaticNodesFileSuffix(context: string) {
  return getDynamicEnvVarValue(DynamicEnvVar.FULL_NODES_STATIC_NODES_FILE_SUFFIX, {
    context,
  })
}

/**
 * Returns the BaseFullNodeDeploymentConfig that is not specific to a cloud
 * provider for a context.
 */
function getFullNodeDeploymentConfig(context: string): BaseFullNodeDeploymentConfig {
  const fullNodeDeploymentEnvVarValues = getContextDynamicEnvVarValues(
    contextFullNodeDeploymentEnvVars,
    context
  )

  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig = {
    diskSizeGb: parseInt(fullNodeDeploymentEnvVarValues.diskSizeGb, 10),
    replicas: parseInt(fullNodeDeploymentEnvVarValues.replicas, 10),
    rollingUpdatePartition: parseInt(fullNodeDeploymentEnvVarValues.rollingUpdatePartition, 10),
    rpcApis: fullNodeDeploymentEnvVarValues.rpcApis,
    gcMode: fullNodeDeploymentEnvVarValues.gcMode,
    wsPort: parseInt(fullNodeDeploymentEnvVarValues.wsPort, 10),
    useGstoreData: fullNodeDeploymentEnvVarValues.useGstoreData,
  }
  return fullNodeDeploymentConfig
}

/**
 * For a given context, returns the appropriate AksFullNodeDeploymentConfig
 */
function getAksFullNodeDeploymentConfig(context: string): AksFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig =
    getFullNodeDeploymentConfig(context)
  return {
    ...fullNodeDeploymentConfig,
    clusterConfig: getAksClusterConfig(context),
  }
}

/**
 * For a given context, returns the appropriate AwsFullNodeDeploymentConfig
 */
function getAwsFullNodeDeploymentConfig(context: string): AwsFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig =
    getFullNodeDeploymentConfig(context)
  return {
    ...fullNodeDeploymentConfig,
    clusterConfig: getAwsClusterConfig(context),
  }
}

/**
 * For a given context, returns the appropriate getGCPFullNodeDeploymentConfig
 */
function getGCPFullNodeDeploymentConfig(context: string): GCPFullNodeDeploymentConfig {
  const fullNodeDeploymentConfig: BaseFullNodeDeploymentConfig =
    getFullNodeDeploymentConfig(context)
  return {
    ...fullNodeDeploymentConfig,
    clusterConfig: getGCPClusterConfig(context),
    // Default value
    createNEG: false,
  }
}
