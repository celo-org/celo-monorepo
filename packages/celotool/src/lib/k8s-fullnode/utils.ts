import { CloudProvider } from '../k8s-cluster/base'
import { AKSFullNodeDeployer, AKSFullNodeDeploymentConfig } from './aks'
import { AWSFullNodeDeployer, AWSFullNodeDeploymentConfig } from './aws'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'

// @ts-ignore
const fullNodeDeployerByCloudProvider: {
  [key in CloudProvider]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string) => BaseFullNodeDeployer
} = {
  [CloudProvider.AWS]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string) => new AWSFullNodeDeployer(deploymentConfig as AWSFullNodeDeploymentConfig, celoEnv),
  [CloudProvider.AZURE]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string) => new AKSFullNodeDeployer(deploymentConfig as AKSFullNodeDeploymentConfig, celoEnv),
}

export function getFullNodeDeployer(cloudProvider: CloudProvider, celoEnv: string, deploymentConfig: BaseFullNodeDeploymentConfig) {
  return fullNodeDeployerByCloudProvider[cloudProvider](deploymentConfig, celoEnv)
}
