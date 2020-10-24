import { AKSClusterConfig, AKSClusterManager } from './aks'
import { AwsClusterConfig, AWSClusterManager } from './aws'
import { BaseClusterConfig, BaseClusterManager, CloudProvider } from './base'
import { GCPClusterConfig, GCPClusterManager } from './gcp'

const clusterManagerByCloudProvider: {
  [key in CloudProvider]: (clusterConfig: BaseClusterConfig, celoEnv: string) => BaseClusterManager
} = {
  [CloudProvider.AWS]: (clusterConfig: BaseClusterConfig, celoEnv: string) => new AWSClusterManager(clusterConfig as AwsClusterConfig, celoEnv),
  [CloudProvider.AZURE]: (clusterConfig: BaseClusterConfig, celoEnv: string) => new AKSClusterManager(clusterConfig as AKSClusterConfig, celoEnv),
  [CloudProvider.GCP]: (clusterConfig: BaseClusterConfig, celoEnv: string) => new GCPClusterManager(clusterConfig as GCPClusterConfig, celoEnv),
}

export function getClusterManager(cloudProvider: CloudProvider, celoEnv: string, clusterConfig: BaseClusterConfig) {
  return clusterManagerByCloudProvider[cloudProvider](clusterConfig, celoEnv)
}
