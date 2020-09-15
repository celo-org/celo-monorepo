import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { BaseClusterConfig, BaseClusterManager } from './base'
import { installCertManagerAndNginx, installGCPSSDStorageClass } from '../helm_deploy'

export interface GCPClusterConfig extends BaseClusterConfig {
  projectName: string
  zone: string
}

export class GCPClusterManager extends BaseClusterManager {
  async switchToSubscription() {

  }

  async getAndSwitchToClusterContext() {
    const {
      clusterName,
      projectName,
      zone
    } = this.clusterConfig
    await execCmdWithExitOnFailure(
      `gcloud container clusters get-credentials ${clusterName} --project ${projectName} --zone ${zone}`
    )
  }

  async setupCluster() {
    await super.setupCluster()
    await installGCPSSDStorageClass()
    await installCertManagerAndNginx()

    // const envType = fetchEnv(envVar.ENV_TYPE)

    // await createNamespaceIfNotExists(celoEnv)

    // const blockchainBackupServiceAccountName = getServiceAccountName('blockchain-backup-for')
    // console.info(`Service account for blockchain backup is \"${blockchainBackupServiceAccountName}\"`)
    //
    // await createServiceAccountIfNotExists(blockchainBackupServiceAccountName)
    // // This role is required for "compute.snapshots.get" permission
    // // Source: https://cloud.google.com/compute/docs/access/iam
    // await grantRoles(blockchainBackupServiceAccountName, 'roles/compute.storageAdmin')
    // // This role is required for "gcloud.container.clusters.get-credentials" permission
    // // This role is required for "container.clusters.get" permission
    // // Source: https://cloud.google.com/kubernetes-engine/docs/how-to/iam
    // await grantRoles(blockchainBackupServiceAccountName, 'roles/container.viewer')

    // await createAndUploadBackupSecretIfNotExists(blockchainBackupServiceAccountName)

    // poll for cluster availability
    // if (createdCluster) {
    //   await pollForRunningCluster()
    // }
    //
    // console.info('Deploying Tiller and Cert Manager Helm chart...')
    //
    // // await
    //
    // await uploadStorageClass()
    // // await redeployTiller()
    //
    // await installCertManagerAndNginx()
    //
    // if (envType !== EnvTypes.DEVELOPMENT) {
    //   console.info('Installing metric tools installation')
    //   await installAndEnableMetricsDeps(true)
    // } else {
    //   console.info('Skipping metric tools installation for this development env')
    // }

    // await setClusterLabels(celoEnv)
    // }
    // await this.installAADPodIdentity()
  }

  get clusterConfig(): GCPClusterConfig {
    return this._clusterConfig as GCPClusterConfig
  }

  get kubernetesContextName(): string {
    return `gke_${this.clusterConfig.projectName}_${this.clusterConfig.zone}_${this.clusterConfig.clusterName}`
  }
}
