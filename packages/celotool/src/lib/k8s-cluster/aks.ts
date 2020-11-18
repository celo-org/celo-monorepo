import { execCmd, execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { outputIncludes } from '../utils'
import { BaseClusterConfig, BaseClusterManager, CloudProvider } from './base'

export interface AksClusterConfig extends BaseClusterConfig {
  tenantId: string
  resourceGroup: string
  subscriptionId: string
  regionName: string
}

export class AksClusterManager extends BaseClusterManager {
  async switchToSubscription() {
    let currentTenantId = null
    try {
      ;[currentTenantId] = await execCmd('az account show --query id -o tsv')
    } catch (error) {
      console.info('No azure account subscription currently set')
    }
    if (currentTenantId === null || currentTenantId.trim() !== this.clusterConfig.tenantId) {
      await execCmdWithExitOnFailure(`az account set --subscription ${this.clusterConfig.subscriptionId}`)
    }
  }

  async getAndSwitchToClusterContext() {
    await execCmdWithExitOnFailure(
      `az aks get-credentials --resource-group ${this.clusterConfig.resourceGroup} --name ${this.clusterConfig.clusterName} --subscription ${this.clusterConfig.subscriptionId} --overwrite-existing`
    )
  }

  async setupCluster() {
    await super.setupCluster()
    await this.installAADPodIdentity()
  }

  // installAADPodIdentity installs the resources necessary for AAD pod level identities
  async installAADPodIdentity() {
    // The helm chart maintained directly by AAD Pod Identity is not compatible with helm v2.
    // Until we upgrade to helm v3, we rely on our own helm chart adapted from:
    // https://raw.githubusercontent.com/Azure/aad-pod-identity/8a5f2ed5941496345592c42e1d6cbd12c32aeebf/deploy/infra/deployment-rbac.yaml
    const aadPodIdentityExists = await outputIncludes(
      `helm list -A`,
      `aad-pod-identity`,
      `aad-pod-identity exists, skipping install`
    )
    if (!aadPodIdentityExists) {
      console.info('Installing aad-pod-identity')
      await execCmdWithExitOnFailure(
        `helm install aad-pod-identity aad-pod-identity/aad-pod-identity`
      )
    }
  }

  get clusterConfig(): AksClusterConfig {
    return this._clusterConfig as AksClusterConfig
  }

  get kubernetesContextName(): string {
    return this.clusterConfig.clusterName
  }

  get cloudProvider(): CloudProvider {
    return CloudProvider.AZURE
  }
}
