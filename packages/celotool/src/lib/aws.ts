import { ClusterConfig, setContextAndCheckForMissingCredentials, setupCloudCluster } from 'src/lib/cloud-provider'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'

/**
 * Basic info for an EKS cluster
 */
export interface AwsClusterConfig extends ClusterConfig {
  clusterRegion: string
}

// switchToAwsCluster configures kubectl to connect to the EKS cluster
export async function switchToAwsCluster(
  celoEnv: string,
  clusterConfig: AwsClusterConfig,
) {

  // TODO Look into switching subscription between testing and production

  const isContextSetCorrectly = await setContextAndCheckForMissingCredentials(clusterConfig)
  if (!isContextSetCorrectly) {
    // If context does not exist, fetch it.
    await execCmdWithExitOnFailure(
      `aws eks --region ${clusterConfig.clusterRegion} update-kubeconfig --name ${clusterConfig.clusterName} --alias ${clusterConfig.clusterName}`
      ) 
  }

  await setupCluster(celoEnv, clusterConfig)
}

// setupCluster is idempotent-- it will only make changes that have not been made
// before. Therefore, it's safe to be called for a cluster that's been fully set up before
async function setupCluster(celoEnv: string, clusterConfig: AwsClusterConfig) {
  await setupCloudCluster(celoEnv, clusterConfig)
  // TODO Find a substitute for AADPodIdentity on AWS
}
