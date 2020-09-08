import { createNamespaceIfNotExists } from 'src/lib/cluster'
import { execCmd, execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { installAndEnableMetricsDeps, redeployTiller } from 'src/lib/helm_deploy'

export enum CloudProvider {
  AWS,
  AZURE,
  GCP,
}

export interface BaseClusterConfig {
  cloudProvider: CloudProvider
  clusterName: string
}

export abstract class BaseClusterManager {
  protected _clusterConfig: BaseClusterConfig
  private _celoEnv: string

  constructor(clusterConfig: BaseClusterConfig, celoEnv: string) {
    this._clusterConfig = clusterConfig
    this._celoEnv = celoEnv
  }

  async switchToClusterContext() {
    const exists = await this.switchToClusterContextIfExists()
    if (!exists) {
      await this.getAndSwitchToClusterContext()
    }
    // Reset back to default namespace
    await execCmdWithExitOnFailure(`kubectl config set-context --current --namespace default`)
    await this.setupCluster()
  }

  /**
   * This will set the current context to the listed cluster name.
   * If a context with the cluster name does not exist, return false.
   * @param clusterConfig
   */
  async switchToClusterContextIfExists() {
    await this.switchToSubscription()

    let currentCluster = null
    try {
      ;[currentCluster] = await execCmd('kubectl config current-context')
    } catch (error) {
      console.info('No cluster currently set')
    }

    // We expect the context to be the cluster name.
    if (currentCluster === null || currentCluster.trim() !== this.clusterConfig.clusterName) {
      const [existingContextsStr] = await execCmdWithExitOnFailure('kubectl config get-contexts -o name')
      const existingContexts = existingContextsStr.trim().split('\n')
      if (existingContexts.includes(this.clusterConfig.clusterName)) {
        await execCmdWithExitOnFailure(`kubectl config use-context ${this.clusterConfig.clusterName}`)
      } else {
        // If we don't already have the context, context set up is not complete.
        // We would still need to retrieve credentials/contexts from the provider
        return false
      }
    }
    return true
  }

  async setupCluster() {
    await createNamespaceIfNotExists(this.celoEnv)

    console.info('Performing any cluster setup that needs to be done...')

    await redeployTiller()
    await installAndEnableMetricsDeps(true, this.clusterConfig)
  }

  abstract switchToSubscription(): Promise<void>
  abstract getAndSwitchToClusterContext(): Promise<void>

  get clusterConfig(): BaseClusterConfig {
    return this._clusterConfig
  }

  get celoEnv(): string {
    return this._celoEnv
  }
}
