import { execCmdWithExitOnFailure } from '../cmd-utils'
import { installGCPSSDStorageClass } from '../helm_deploy'
import { switchToGCPProject } from '../utils'
import { BaseClusterConfig, BaseClusterManager, CloudProvider } from './base'

export interface GCPClusterConfig extends BaseClusterConfig {
  projectName: string
  zone: string
}

export class GCPClusterManager extends BaseClusterManager {
  async switchToSubscription() {
    await switchToGCPProject(this.clusterConfig.projectName)
  }

  async getAndSwitchToClusterContext() {
    const { clusterName, projectName, zone } = this.clusterConfig
    await execCmdWithExitOnFailure(
      `gcloud container clusters get-credentials ${clusterName} --project ${projectName} --zone ${zone}`
    )
  }

  async setupCluster(context?: string) {
    await super.setupCluster(context)
    await installGCPSSDStorageClass()
  }

  get clusterConfig(): GCPClusterConfig {
    return this._clusterConfig as GCPClusterConfig
  }

  get kubernetesContextName(): string {
    return `gke_${this.clusterConfig.projectName}_${this.clusterConfig.zone}_${this.clusterConfig.clusterName}`
  }

  get cloudProvider(): CloudProvider {
    return CloudProvider.GCP
  }
}
