import { execCmd, execCmdWithExitOnFailure } from '../cmd-utils'
import { envVar, fetchEnv, fetchEnvOrFallback } from '../env-utils'
import { helmAddRepoAndUpdate, isCelotoolHelmDryRun } from '../helm_deploy'
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
      await execCmdWithExitOnFailure(
        `az account set --subscription ${this.clusterConfig.subscriptionId}`
      )
    }
  }

  async getAndSwitchToClusterContext() {
    const kubeconfig = fetchEnvOrFallback(envVar.KUBECONFIG, '')
      ? `--file ${fetchEnv(envVar.KUBECONFIG)}`
      : ''
    await execCmdWithExitOnFailure(
      `az aks get-credentials --resource-group ${this.clusterConfig.resourceGroup} --name ${this.clusterConfig.clusterName} --subscription ${this.clusterConfig.subscriptionId} --overwrite-existing ${kubeconfig}`
    )
  }

  async setupCluster(context?: string) {
    await super.setupCluster(context)
    await this.installAADPodIdentity()
  }

  // installAADPodIdentity installs the resources necessary for AAD pod level identities
  async installAADPodIdentity() {
    // The helm chart maintained directly by AAD Pod Identity is not compatible with helm v2.
    // Until we upgrade to helm v3, we rely on our own helm chart adapted from:
    // https://raw.githubusercontent.com/Azure/aad-pod-identity/8a5f2ed5941496345592c42e1d6cbd12c32aeebf/deploy/infra/deployment-rbac.yaml
    const aadPodIdentityExists = await outputIncludes(
      `helm list -n default`,
      `aad-pod-identity`,
      `aad-pod-identity exists, skipping install`
    )
    if (!aadPodIdentityExists) {
      if (isCelotoolHelmDryRun()) {
        console.info('Skipping aad-pod-identity deployment due to --helmdryrun')
      } else {
        console.info('Adding aad-pod-identity helm repository to local helm')
        await helmAddRepoAndUpdate(
          'https://raw.githubusercontent.com/Azure/aad-pod-identity/master/charts',
          'aad-pod-identity'
        )
        console.info('Installing aad-pod-identity')
        await execCmdWithExitOnFailure(
          `helm install aad-pod-identity aad-pod-identity/aad-pod-identity -n default`
        )
      }
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
