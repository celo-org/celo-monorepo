import { CloudProvider } from '../k8s-cluster/base'
import { AksFullNodeDeployer, AksFullNodeDeploymentConfig } from './aks'
import { AwsFullNodeDeployer, AwsFullNodeDeploymentConfig } from './aws'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'
import { GCPFullNodeDeployer, GCPFullNodeDeploymentConfig } from './gcp'

const fullNodeDeployerByCloudProvider: {
  [key in CloudProvider]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string, context: string) => BaseFullNodeDeployer
} = {
  [CloudProvider.AWS]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string, context: string) => new AwsFullNodeDeployer(deploymentConfig as AwsFullNodeDeploymentConfig, celoEnv, context),
  [CloudProvider.AZURE]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string, context: string) => new AksFullNodeDeployer(deploymentConfig as AksFullNodeDeploymentConfig, celoEnv, context),
  [CloudProvider.GCP]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string, context: string) => new GCPFullNodeDeployer(deploymentConfig as GCPFullNodeDeploymentConfig, celoEnv, context),
}

export function getFullNodeDeployer(cloudProvider: CloudProvider, celoEnv: string, context: string, deploymentConfig: BaseFullNodeDeploymentConfig) {
  return fullNodeDeployerByCloudProvider[cloudProvider](deploymentConfig, celoEnv, context)
}
