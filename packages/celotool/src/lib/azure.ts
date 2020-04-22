import { createNamespaceIfNotExists } from './cluster'
import { doCheckOrPromptIfStagingOrProduction, envVar, fetchEnv } from './env-utils'
import { installAndEnableMetricsDeps, redeployTiller } from './helm_deploy'
import { execCmd, execCmdWithExitOnFailure, outputIncludes } from './utils'

// switchToClusterFromEnv configures kubectl to connect to the AKS cluster
export async function switchToClusterFromEnv(
  celoEnv: string,
  checkOrPromptIfStagingOrProduction = true
) {
  if (checkOrPromptIfStagingOrProduction) {
    await doCheckOrPromptIfStagingOrProduction()
  }

  let currentCluster = null
  try {
    ;[currentCluster] = await execCmd('kubectl config current-context')
  } catch (error) {
    console.info('No cluster currently set')
  }

  if (currentCluster === null || currentCluster.trim() !== clusterName()) {
    // If a context is edited for some reason (eg switching default namespace),
    // a warning and prompt is shown asking if the existing context should be
    // overwritten. To avoid this, --overwrite-existing force overwrites.
    await execCmdWithExitOnFailure(
      `az aks get-credentials --resource-group ${resourceGroup()} --name ${clusterName()} --subscription ${subscriptionId()} --overwrite-existing`
    )
  }
  await setupCluster(celoEnv)
}

// setupCluster is idempotent-- it will only make changes that have not been made
// before. Therefore, it's safe to be called for a cluster that's been fully set up before
async function setupCluster(celoEnv: string) {
  await createNamespaceIfNotExists(celoEnv)

  console.info('Performing any cluster setup that needs to be done...')

  await redeployTiller()
  await installAndEnableMetricsDeps(false)
  await installAADPodIdentity()
}

// installAADPodIdentity installs the resources necessary for AAD pod level identities
async function installAADPodIdentity() {
  // The helm chart maintained directly by AAD Pod Identity is not compatible with helm v2.
  // Until we upgrade to helm v3, we rely on our own helm chart adapted from:
  // https://raw.githubusercontent.com/Azure/aad-pod-identity/8a5f2ed5941496345592c42e1d6cbd12c32aeebf/deploy/infra/deployment-rbac.yaml
  const aadPodIdentityExists = await outputIncludes(
    `helm list`,
    `aad-pod-identity`,
    `aad-pod-identity exists, skipping install`
  )
  if (!aadPodIdentityExists) {
    console.info('Installing aad-pod-identity')
    await execCmdWithExitOnFailure(
      `helm install --name aad-pod-identity ../helm-charts/aad-pod-identity`
    )
  }
}

// createIdentityIfNotExists creates an identity if it doesn't already exist.
// Returns an object including basic info on the identity.
export async function createIdentityIfNotExists(identityName: string) {
  // This command is idempotent-- if the identity exists, the existing one is given
  const [results] = await execCmdWithExitOnFailure(
    `az identity create -n ${identityName} -g ${resourceGroup()} -o json`
  )
  return JSON.parse(results)
}

export function resourceGroup() {
  return fetchEnv(envVar.AZURE_KUBERNETES_RESOURCE_GROUP)
}

export function clusterName() {
  return fetchEnv(envVar.AZURE_KUBERNETES_CLUSTER_NAME)
}

export function subscriptionId() {
  return fetchEnv(envVar.AZURE_SUBSCRIPTION_ID)
}
