import { AKSFullNodeDeployer, AKSFullNodeDeploymentConfig } from './aks-fullnode'
import { AWSFullNodeDeployer, AWSFullNodeDeploymentConfig } from './aws-fullnode'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'

import { CloudProvider } from '../cloud-provider'

const fullNodeDeployerByPrefix: {
  [key in CloudProvider]: (deploymentConfig: BaseFullNodeDeploymentConfig) => BaseFullNodeDeployer
} = {
  [CloudProvider.AWS]: (deploymentConfig) => new AWSFullNodeDeployer(deploymentConfig as AWSFullNodeDeploymentConfig),
  [CloudProvider.AZURE]: (deploymentConfig) => new AKSFullNodeDeployer(deploymentConfig as AKSFullNodeDeploymentConfig),
}

export function getFullNodeDeployer(cloudProvider: CloudProvider, deploymentConfig: BaseFullNodeDeploymentConfig) {
  return fullNodeDeployerByPrefix[cloudProvider](deploymentConfig)
}
