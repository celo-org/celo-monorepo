import {
  doCheckOrPromptIfStagingOrProduction,
  EnvTypes,
  envVar,
  fetchEnv,
} from '@celo/celotool/src/lib/env-utils'
import {
  createAndUploadBackupSecretIfNotExists,
  createServiceAccountIfNotExists,
  getServiceAccountName,
  grantRoles,
  installAndEnableMetricsDeps,
  installLegoAndNginx,
  redeployTiller,
  uploadStorageClass,
} from '@celo/celotool/src/lib/helm_deploy'
import {
  execCmd,
  execCmdWithExitOnFailure,
  outputIncludes,
  switchToProjectFromEnv,
} from '@celo/celotool/src/lib/utils'
import { networkName } from '@celo/celotool/src/lib/vm-testnet-utils'
import sleep from 'sleep-promise'

const SYSTEM_HELM_RELEASES = ['nginx-ingress-release', 'kube-lego-release']
const HELM_RELEASE_REGEX = new RegExp(/(.*)-\d+\.\d+\.\d+$/)

export async function switchToClusterFromEnv(checkOrPromptIfStagingOrProduction = true) {
  if (checkOrPromptIfStagingOrProduction) {
    await doCheckOrPromptIfStagingOrProduction()
  }

  await switchToProjectFromEnv()

  let currentCluster = null
  try {
    ;[currentCluster] = await execCmd('kubectl config current-context')
  } catch (error) {
    console.info('No cluster currently set')
  }

  const projectName = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  const kubernetesClusterName = fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)
  const kubernetesClusterZone = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)

  const expectedCluster = `gke_${projectName}_${kubernetesClusterName}_${kubernetesClusterName}`

  if (currentCluster === null || currentCluster.trim() !== expectedCluster) {
    await execCmdWithExitOnFailure(
      `gcloud container clusters get-credentials ${kubernetesClusterName} --project ${projectName} --zone ${kubernetesClusterZone}`
    )
  }
}

export async function createClusterIfNotExists() {
  const kubernetesClusterName = fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)
  const kubernetesClusterZone = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)
  await switchToProjectFromEnv()
  const clusterExists = await outputIncludes(
    `gcloud container clusters list --zone ${kubernetesClusterZone} --filter NAME=${kubernetesClusterName}`,
    kubernetesClusterName,
    `Cluster ${kubernetesClusterName} exists, skipping creation`
  )

  if (!clusterExists) {
    const network = networkName(fetchEnv(envVar.CELOTOOL_CELOENV))
    console.info(`Creating cluster ${kubernetesClusterName} on network ${network}...`)
    await execCmdWithExitOnFailure(
      `gcloud container clusters create ${kubernetesClusterName} --zone ${kubernetesClusterZone} ${fetchEnv(
        envVar.CLUSTER_CREATION_FLAGS
      )} --network ${network}`
    )
    return true
  }

  return false
}

export async function setupCluster(celoEnv: string, createdCluster: boolean) {
  const envType = fetchEnv(envVar.ENV_TYPE)

  const namespaceExists = await outputIncludes(
    `kubectl get namespaces ${celoEnv} || true`,
    celoEnv,
    `Namespace ${celoEnv} exists, skipping creation`
  )
  if (!namespaceExists) {
    console.info('Creating kubernetes namespace')
    await execCmdWithExitOnFailure(`kubectl create namespace ${celoEnv}`)
  }

  const blockchainBackupServiceAccountName = getServiceAccountName('blockchain-backup-for')
  console.info(`Service account for blockchain backup is \"${blockchainBackupServiceAccountName}\"`)

  await createServiceAccountIfNotExists(blockchainBackupServiceAccountName)
  // This role is required for "compute.snapshots.get" permission
  // Source: https://cloud.google.com/compute/docs/access/iam
  await grantRoles(blockchainBackupServiceAccountName, 'roles/compute.storageAdmin')
  // This role is required for "gcloud.container.clusters.get-credentials" permission
  // This role is required for "container.clusters.get" permission
  // Source: https://cloud.google.com/kubernetes-engine/docs/how-to/iam
  await grantRoles(blockchainBackupServiceAccountName, 'roles/container.viewer')

  await createAndUploadBackupSecretIfNotExists(blockchainBackupServiceAccountName)

  // poll for cluster availability
  if (createdCluster) {
    await pollForRunningCluster()
  }

  console.info('Deploying Tiller and Helm chart...')

  await uploadStorageClass()
  await redeployTiller()

  await installLegoAndNginx()

  if (envType !== EnvTypes.DEVELOPMENT) {
    await installAndEnableMetricsDeps()
  } else {
    console.info('Skipping metrics installation for this development env.')
  }

  await setClusterLabels(celoEnv)
}

export async function pollForRunningCluster() {
  const kubernetesClusterName = fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)
  const kubernetesClusterZone = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)

  await switchToProjectFromEnv()

  let attempts = 0
  while (attempts < 10) {
    console.info('Waiting for cluster to be in status=RUNNING')
    const [status] = await execCmdWithExitOnFailure(
      `gcloud container clusters describe --zone ${kubernetesClusterZone} ${kubernetesClusterName} --format="value(status)"`
    )
    if (status.trim() === 'RUNNING') {
      return
    }
    attempts += 1
    await sleep(Math.pow(2, attempts) * 1000)
  }

  console.error('Waited for too long for running cluster')
  process.exit(1)
}

export async function deleteCluster() {
  const kubernetesClusterName = fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)
  const kubernetesClusterZone = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)

  await switchToProjectFromEnv()
  const clusterExists = await outputIncludes(
    `gcloud container clusters list --zone ${kubernetesClusterZone} --filter NAME=${kubernetesClusterName}`,
    kubernetesClusterName
  )
  if (!clusterExists) {
    console.error(`Cluster ${kubernetesClusterName} does not exist`)
    process.exit(1)
  }

  await execCmdWithExitOnFailure(
    `gcloud container clusters delete ${kubernetesClusterName} --zone ${kubernetesClusterZone} --quiet`
  )
}

export async function setClusterLabels(celoEnv: string) {
  const envType = fetchEnv(envVar.ENV_TYPE)
  const labelfn = async (key: string, value: string) => {
    await execCmdWithExitOnFailure(
      `gcloud container clusters update ${fetchEnv(
        envVar.KUBERNETES_CLUSTER_NAME
      )} --update-labels ${key}=${value} --zone ${fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)}`
    )
  }
  await labelfn('environment', envType)
  await labelfn('envtype', envType === EnvTypes.PRODUCTION ? 'production' : 'nonproduction')
  await labelfn('envinstance', celoEnv)
}

export function getKubernetesClusterRegion(): string {
  const zone = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)
  const matches = zone.match('^[a-z]+-[a-z]+[0-9]')
  if (matches) {
    return matches[0]
  } else {
    console.error('Unable to find kubernetes cluster region')
    process.exit(1)
    // Make the compiler happy
    return ''
  }
}
export interface HelmRelease {
  Name: string
  Chart: string
  Status: string
  Updated: string
  Namespace: string
}

export async function getNonSystemHelmReleases(): Promise<HelmRelease[]> {
  const [json] = await execCmdWithExitOnFailure(`helm list --output json`)
  const releases: HelmRelease[] = JSON.parse(json).Releases
  return releases.filter((release) => !SYSTEM_HELM_RELEASES.includes(release.Name))
}

export function getPackageName(name: string) {
  const prefix = HELM_RELEASE_REGEX.exec(name)
  if (!prefix) {
    return ''
  }

  return prefix[1] === 'ethereum' ? 'testnet' : prefix[1]
}
