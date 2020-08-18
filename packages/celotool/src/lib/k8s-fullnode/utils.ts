import { AKSFullNodeDeployer, AKSFullNodeDeploymentConfig } from './aks'
import { AWSFullNodeDeployer, AWSFullNodeDeploymentConfig } from './aws'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'

import { CloudProvider } from '../cloud-provider'

const fullNodeDeployerByPrefix: {
  [key in CloudProvider]: (deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string) => BaseFullNodeDeployer
} = {
  [CloudProvider.AWS]: (deploymentConfig, celoEnv: string) => new AWSFullNodeDeployer(deploymentConfig as AWSFullNodeDeploymentConfig, celoEnv),
  [CloudProvider.AZURE]: (deploymentConfig, celoEnv: string) => new AKSFullNodeDeployer(deploymentConfig as AKSFullNodeDeploymentConfig, celoEnv),
}

export function getFullNodeDeployer(cloudProvider: CloudProvider, celoEnv: string, deploymentConfig: BaseFullNodeDeploymentConfig) {
  return fullNodeDeployerByPrefix[cloudProvider](deploymentConfig, celoEnv)
}
