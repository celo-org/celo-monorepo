import { AksClusterConfig, AksClusterManager } from './aks'
import { BaseClusterConfig, BaseClusterManager, CloudProvider } from './base'
import { GCPClusterConfig, GCPClusterManager } from './gcp'

const clusterManagerByCloudProvider: {
  [key in CloudProvider]: (clusterConfig: BaseClusterConfig, celoEnv: string) => BaseClusterManager
} = {
  [CloudProvider.AZURE]: (clusterConfig: BaseClusterConfig, celoEnv: string) =>
    new AksClusterManager(clusterConfig as AksClusterConfig, celoEnv),
  [CloudProvider.GCP]: (clusterConfig: BaseClusterConfig, celoEnv: string) =>
    new GCPClusterManager(clusterConfig as GCPClusterConfig, celoEnv),
}

export function getClusterManager(
  cloudProvider: CloudProvider,
  celoEnv: string,
  clusterConfig: BaseClusterConfig
) {
  return clusterManagerByCloudProvider[cloudProvider](clusterConfig, celoEnv)
}
