import {
  doCheckOrPromptIfStagingOrProduction,
  EnvTypes,
  envVar,
  execCmd,
  execCmdWithExitOnFailure,
  fetchEnv,
  outputIncludes,
  switchToProjectFromEnv,
} from '@celo/celotool/src/lib/utils'
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
    console.info(`Creating cluster ${kubernetesClusterName}...`)
    await execCmdWithExitOnFailure(
      `gcloud container clusters create ${kubernetesClusterName} --zone ${kubernetesClusterZone} ${fetchEnv(
        envVar.CLUSTER_CREATION_FLAGS
      )}`
    )
    return true
  }

  return false
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
