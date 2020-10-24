import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { BaseClusterConfig, BaseClusterManager, CloudProvider } from './base'

/**
 * Basic info for an EKS cluster
 */
export interface AwsClusterConfig extends BaseClusterConfig {
  clusterRegion: string,
  resourceGroupTag: string
}

export class AWSClusterManager extends BaseClusterManager {
  async switchToSubscription() {
    // TODO: not supported at the moment
  }

  async getAndSwitchToClusterContext() {
    await execCmdWithExitOnFailure(
      `aws eks --region ${this.clusterConfig.clusterRegion} update-kubeconfig --name ${this.clusterConfig.clusterName} --alias ${this.clusterConfig.clusterName}`
    )
  }

  get clusterConfig(): AwsClusterConfig {
    return this._clusterConfig as AwsClusterConfig
  }

  get kubernetesContextName(): string {
    return this.clusterConfig.clusterName
  }

  get cloudProvider(): CloudProvider {
    return CloudProvider.AWS
  }
}
