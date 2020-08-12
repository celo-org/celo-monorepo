import { createNamespaceIfNotExists } from 'src/lib/cluster'
import { execCmd, execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { deletePersistentVolumeClaims, installAndEnableMetricsDeps, installGenericHelmChart, redeployTiller, upgradeGenericHelmChart } from 'src/lib/helm_deploy'
import { scaleResource } from 'src/lib/kubernetes'
import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'

export interface ClusterConfig {
  clusterName: string
  cloudProviderName: string
}

export interface FullNodeDeploymentConfig {
  diskSizeGb: number
  replicas: number
}

/**
 * This will set the current context to the listed cluster name.
 * If a context with the cluster name does not exist, return false.
 * @param clusterConfig
 */
export async function setContextAndCheckForMissingCredentials(
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

export async function setupCloudCluster(celoEnv: string, clusterConfig: ClusterConfig) {
  await createNamespaceIfNotExists(celoEnv)

  console.info('Performing any cluster setup that needs to be done...')

  await redeployTiller()
  await installAndEnableMetricsDeps(true, clusterConfig)
}

// FULL NODES

export function getReleaseName(celoEnv: string) {
  return `${celoEnv}-fullnodes`
}

export function getKubeNamespace(celoEnv: string) {
  return celoEnv
}

export function getStaticIPNamePrefix(celoEnv: string) {
  return `${celoEnv}-nodes`
}

export async function baseHelmParameters(
  celoEnv: string,
  kubeNamespace: string,
  deploymentConfig: FullNodeDeploymentConfig
) {
  const rpcApis = 'eth,net,rpc,web3'
  return [
    `--set namespace=${kubeNamespace}`,
    `--set replicaCount=${deploymentConfig.replicas}`,
    `--set storage.size=${deploymentConfig.diskSizeGb}Gi`,
    `--set geth.expose_rpc_externally=false`,
    `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
    `--set-string geth.rpc_apis='${rpcApis.split(',').join('\\\,')}'`,
    `--set geth.metrics=${fetchEnvOrFallback(envVar.GETH_ENABLE_METRICS, 'false')}`,
    `--set genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set genesis.network=${celoEnv}`,
  ]
}

export async function installBaseFullNodeChart(celoEnv: string, helmParameter: string[], helmChartPath = '../helm-charts/celo-fullnode') {
  const kubeNamespace = getKubeNamespace(celoEnv)
  const releaseName = getReleaseName(celoEnv)
  await createNamespaceIfNotExists(kubeNamespace)

  return installGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    helmParameter
  )
}

export async function upgradeBaseFullNodeChart(
  celoEnv: string,
  deploymentConfig: FullNodeDeploymentConfig,
  reset: boolean,
  cloudHelmParameters: string[],
  helmChartPath = '../helm-charts/celo-fullnode'
) {
  const kubeNamespace = getKubeNamespace(celoEnv)
  const releaseName = getReleaseName(celoEnv)

  if (reset) {
    await scaleResource(celoEnv, 'StatefulSet', `${celoEnv}-fullnodes`, 0)
    await deletePersistentVolumeClaims(celoEnv, ['celo-fullnode'])
  }

  await upgradeGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    cloudHelmParameters
  )

  await scaleResource(celoEnv, 'StatefulSet', `${celoEnv}-fullnodes`, deploymentConfig.replicas)
  return
}



// {{- if $.Values.geth.azure_provider }}
// service.beta.kubernetes.io/azure-load-balancer-mixed-protocols: "true"
// {{- else }}
// service.beta.kubernetes.io/aws-load-balancer-type: “nlb”
// {{- end }}


// {{- if $.Values.geth.use_static_ips }}
//   {{- if $.Values.geth.azure_provider -}}
//   loadBalancerIP: {{ index $.Values.geth.public_ips $index -}}
//   {{- else  }}
//   service.beta.kubernetes.io/aws-load-balancer-eip-allocations: {{ index $.Values.geth.public_ips $index -}}
//   {{- end -}}
