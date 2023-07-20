import { execCmdWithExitOnFailure } from '../cmd-utils'
import { installGenericHelmChart } from '../helm_deploy'
import { outputIncludes } from '../utils'
import { BaseClusterConfig, BaseClusterManager, CloudProvider } from './base'

/**
 * Basic info for an EKS cluster
 */
export interface AwsClusterConfig extends BaseClusterConfig {
  clusterRegion: string
  resourceGroupTag: string
}

export class AwsClusterManager extends BaseClusterManager {
  async switchToSubscription() {
    // TODO: not supported at the moment
  }

  async getAndSwitchToClusterContext() {
    await execCmdWithExitOnFailure(
      `aws eks --region ${this.clusterConfig.clusterRegion} update-kubeconfig --name ${this.clusterConfig.clusterName} --alias ${this.clusterConfig.clusterName}`
    )
  }

  async setupCluster(context?: string) {
    await super.setupCluster(context)
    await this.installKube2Iam()
  }

  // installs kube2iam if it doesn't exist, which allows us to give AWS roles to pods
  async installKube2Iam() {
    const releaseName = 'kube2iam'
    const exists = await outputIncludes(
      `helm list`,
      releaseName,
      `${releaseName} exists, skipping install`
    )
    if (!exists) {
      console.info(`Installing ${releaseName}`)
      await installGenericHelmChart({
        namespace: 'default',
        releaseName,
        chartDir: 'stable/kube2iam',
        parameters: [
          // Modifies node iptables to have AWS api requests be proxied by kube2iam
          `--set host.iptables=true`,
          // The network interface EKS uses
          `--set host.interface="eni+"`,
          // enable rbac
          `--set rbac.create=true`,
        ],
        buildDependencies: false,
      })
    }
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
