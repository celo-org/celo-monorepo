import { createNamespaceIfNotExists } from 'src/lib/cluster'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import {
  helmAddAndUpdateRepos,
  installHelmDiffPlugin,
  isCelotoolHelmDryRun,
  isCelotoolVerbose,
  removeGenericHelmChart,
} from 'src/lib/helm_deploy'
import { BaseClusterConfig, CloudProvider } from 'src/lib/k8s-cluster/base'
import { GCPClusterConfig } from 'src/lib/k8s-cluster/gcp'
import {
  createServiceAccountIfNotExists,
  getServiceAccountEmail,
  setupGKEWorkloadIdentities,
} from 'src/lib/service-account-utils'
import { outputIncludes } from 'src/lib/utils'

// https://artifacthub.io/packages/helm/grafana/promtail
const helmChartPath = 'grafana/promtail'
const valuesFilePath = '../helm-charts/promtail/values.yaml'
const releaseName = 'promtail'
const kubeNamespace = 'prometheus'
const kubeServiceAccountName = 'gcp-promtail-loki-grafana'
const promtailImageTag = '2.3.0'
const chartVersion = '3.8.2'

export async function installPromtailIfNotExists(clusterConfig?: BaseClusterConfig) {
  const promtailExists = await outputIncludes(
    `helm list -n ${kubeNamespace}`,
    releaseName,
    `${releaseName} exists, skipping install`
  )
  if (!promtailExists) {
    console.info(`Installing ${releaseName}`)
    await installPromtail(clusterConfig)
  }
}

async function installPromtail(clusterConfig?: BaseClusterConfig) {
  await helmAddAndUpdateRepos()
  await createNamespaceIfNotExists(kubeNamespace)

  const cmd = await buildHelmUpgradeCmd(await helmParameters(clusterConfig))
  await execCmdWithExitOnFailure(cmd, {}, isCelotoolVerbose())
}

export async function removePromtail() {
  await removeGenericHelmChart(releaseName, kubeNamespace)
}

export async function upgradePromtail(clusterConfig?: BaseClusterConfig) {
  const cmd = await buildHelmUpgradeCmd(await helmParameters(clusterConfig))
  await execCmdWithExitOnFailure(cmd, {}, isCelotoolVerbose())
}

async function helmParameters(clusterConfig?: BaseClusterConfig) {
  const params = []

  // Find which cloud provider is in use
  const cloudProvider = clusterConfig ? clusterConfig.cloudProvider : CloudProvider.GCP

  switch (cloudProvider) {
    case CloudProvider.GCP:
      let gcpProjectName, clusterName
      if (clusterConfig) {
        const configGCP = clusterConfig as GCPClusterConfig
        gcpProjectName = configGCP!.projectName
        clusterName = configGCP!.clusterName
      } else {
        gcpProjectName = fetchEnv(envVar.TESTNET_PROJECT_NAME)
        clusterName = fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)
      }

      const serviceAccountName = await createPromtailGcloudServiceAccount(
        gcpProjectName,
        clusterName
      )
      const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)

      params.push(
        `--set serviceAccount.annotations.'iam\\\.gke\\\.io/gcp-service-account'=${serviceAccountEmail}`
      )
      params.push(`--set extraArgs[0]='-client.external-labels=cluster_name=${clusterName}'`)
      break

    case CloudProvider.AZURE:
      // Adding cluster_name label
      params.push(
        `--set extraArgs[0]='-client.external-labels=cluster_name=${clusterConfig?.clusterName}'`
      )
      break
  }

  const user = fetchEnv(envVar.LOKI_USERNAME)
  const key = fetchEnv(envVar.LOKI_KEY)
  const url = fetchEnv(envVar.LOKI_URL)
  params.push(`--set config.lokiAddress=https://${user}:${key}@${url}`)
  params.push(`--set promtail.imageTag=${promtailImageTag}`)
  params.push(`--version=${chartVersion}`)

  return params
}

async function createPromtailGcloudServiceAccount(gcpProjectName: string, clusterName: string) {
  // Create a new GCP Service Account
  const serviceAccountName = getServiceAccountName(clusterName, 'gcp')

  const accountCreated = await createServiceAccountIfNotExists(
    serviceAccountName,
    gcpProjectName,
    'Loki/Promtail service account to push logs to Grafana Cloud'
  )

  if (accountCreated) {
    // Setup workload identity IAM permissions
    await setupGKEWorkloadIdentities(
      serviceAccountName,
      gcpProjectName,
      kubeNamespace,
      kubeServiceAccountName
    )
  }

  return serviceAccountName
}

// TODO: refactor with the function in prometheus
function getServiceAccountName(clusterName: string, cloudProvider: string) {
  return `promtail-${cloudProvider}-${clusterName}`.substring(0, 30).replace(/[^a-zA-Z0-9]+$/g, '')
}

async function buildHelmUpgradeCmd(params: string[]) {
  if (isCelotoolHelmDryRun()) {
    await installHelmDiffPlugin()
  }

  let cmd = `helm ${
    isCelotoolHelmDryRun() ? 'diff -C 5' : ''
  } upgrade --install ${releaseName} ${helmChartPath} \
  -n ${kubeNamespace} \
  -f ${valuesFilePath} \
  ${params.join(' ')}`

  if (isCelotoolVerbose()) {
    cmd += ' --debug'
    if (isCelotoolHelmDryRun()) {
      // The promtail config is a k8s secret.
      cmd += ' --show-secrets'
    }
  }

  return cmd
}
