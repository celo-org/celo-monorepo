import { CloudProvider } from '../k8s-cluster/base'
import { AKSFullNodeDeployer, AKSFullNodeDeploymentConfig } from './aks'
import { AWSFullNodeDeployer, AWSFullNodeDeploymentConfig } from './aws'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'
import { GCPFullNodeDeployer, GCPFullNodeDeploymentConfig } from './gcp'

// @ts-ignore
const fullNodeDeployerByCloudProvider: {
  [key in CloudProvider]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string) => BaseFullNodeDeployer
} = {
  [CloudProvider.AWS]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string) => new AWSFullNodeDeployer(deploymentConfig as AWSFullNodeDeploymentConfig, celoEnv),
  [CloudProvider.AZURE]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string) => new AKSFullNodeDeployer(deploymentConfig as AKSFullNodeDeploymentConfig, celoEnv),
  [CloudProvider.GCP]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string) => new GCPFullNodeDeployer(deploymentConfig as GCPFullNodeDeploymentConfig, celoEnv),
}

export function getFullNodeDeployer(cloudProvider: CloudProvider, celoEnv: string, deploymentConfig: BaseFullNodeDeploymentConfig) {
  return fullNodeDeployerByCloudProvider[cloudProvider](deploymentConfig, celoEnv)
}
