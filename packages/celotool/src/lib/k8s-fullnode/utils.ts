import { CloudProvider } from '../k8s-cluster/base'
import { AksFullNodeDeployer, AksFullNodeDeploymentConfig } from './aks'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'
import { GCPFullNodeDeployer, GCPFullNodeDeploymentConfig } from './gcp'

const fullNodeDeployerByCloudProvider: {
  [key in CloudProvider]: (
    deploymentConfig: BaseFullNodeDeploymentConfig,
    celoEnv: string
  ) => BaseFullNodeDeployer
} = {
  [CloudProvider.AZURE]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string) =>
    new AksFullNodeDeployer(deploymentConfig as AksFullNodeDeploymentConfig, celoEnv),
  [CloudProvider.GCP]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string) =>
    new GCPFullNodeDeployer(deploymentConfig as GCPFullNodeDeploymentConfig, celoEnv),
}

export function getFullNodeDeployer(
  cloudProvider: CloudProvider,
  celoEnv: string,
  deploymentConfig: BaseFullNodeDeploymentConfig
) {
  return fullNodeDeployerByCloudProvider[cloudProvider](deploymentConfig, celoEnv)
}
