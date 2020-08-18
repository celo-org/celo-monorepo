import { createNamespaceIfNotExists } from 'src/lib/cluster'
import { execCmd, execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { installAndEnableMetricsDeps, redeployTiller } from 'src/lib/helm_deploy'

export enum CloudProvider {
  AWS,
  AZURE,
}

export interface ClusterConfig {
  clusterName: string
  cloudProviderName: string
}

/**
 * This will set the current context to the listed cluster name.
 * If a context with the cluster name does not exist, return false.
 * @param clusterConfig
 */
export async function switchToClusterContextIfExists(
  clusterConfig: ClusterConfig,
) {
  let currentCluster = null
  try {
    ;[currentCluster] = await execCmd('kubectl config current-context')
  } catch (error) {
    console.info('No cluster currently set')
  }

  // We expect the context to be the cluster name.
  if (currentCluster === null || currentCluster.trim() !== clusterConfig.clusterName) {
    const [existingContextsStr] = await execCmdWithExitOnFailure('kubectl config get-contexts -o name')
    const existingContexts = existingContextsStr.trim().split('\n')
    if (existingContexts.includes(clusterConfig.clusterName)) {
      await execCmdWithExitOnFailure(`kubectl config use-context ${clusterConfig.clusterName}`)
    } else {
      // If we don't already have the context, context set up is not complete.
      // We would still need to retrieve credentials/contexts from the provider
      return false
    }
  }
  return true
}

export async function setupCluster(celoEnv: string, clusterConfig: ClusterConfig) {
  await createNamespaceIfNotExists(celoEnv)

  console.info('Performing any cluster setup that needs to be done...')

  await redeployTiller()
  await installAndEnableMetricsDeps(true, clusterConfig)
}
