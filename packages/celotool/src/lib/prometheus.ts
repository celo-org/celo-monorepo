import fs from 'fs'
import { createNamespaceIfNotExists } from './cluster'
import {
  DynamicEnvVar,
  envVar,
  fetchEnv,
  fetchEnvOrFallback,
  getDynamicEnvVarValue,
} from './env-utils'
import {
  helmAddRepoAndUpdate,
  installGenericHelmChart,
  removeGenericHelmChart,
  setHelmArray,
  upgradeGenericHelmChart,
} from './helm_deploy'
import { BaseClusterConfig, CloudProvider } from './k8s-cluster/base'
import { outputIncludes } from './utils'
const yaml = require('js-yaml')

const helmChartPath = '../helm-charts/prometheus'
const releaseName = 'prometheus'
const kubeNamespace = 'prometheus'
const kubeServiceAccountName = releaseName
// Prometheus container registry with latest tags: https://hub.docker.com/r/prom/prometheus/tags
const prometheusImageTag = 'v2.38.0'

const grafanaHelmRepo = 'grafana/grafana'
const grafanaChartVersion = '6.32.3'
const grafanaReleaseName = 'grafana'

export async function installPrometheusIfNotExists(
  context?: string,
  clusterConfig?: BaseClusterConfig
) {
  const prometheusExists = await outputIncludes(
    `helm list -n prometheus`,
    releaseName,
    `prometheus exists, skipping install`
  )
  if (!prometheusExists) {
    console.info('Installing prometheus')
    await installPrometheus(context, clusterConfig)
  }
}

async function installPrometheus(context?: string, clusterConfig?: BaseClusterConfig) {
  await createNamespaceIfNotExists(kubeNamespace)
  return installGenericHelmChart({
    namespace: kubeNamespace,
    releaseName,
    chartDir: helmChartPath,
    parameters: await helmParameters(context, clusterConfig),
  })
}

export async function removePrometheus() {
  await removeGenericHelmChart(releaseName, kubeNamespace)
}

export async function upgradePrometheus(context?: string, clusterConfig?: BaseClusterConfig) {
  await createNamespaceIfNotExists(kubeNamespace)
  return upgradeGenericHelmChart({
    namespace: kubeNamespace,
    releaseName,
    chartDir: helmChartPath,
    parameters: await helmParameters(context, clusterConfig),
  })
}

function getK8sContextVars(
  clusterConfig?: BaseClusterConfig,
  context?: string
): [string, string, string, string, boolean] {
  const cloudProvider = clusterConfig ? getCloudProviderPrefix(clusterConfig!) : 'gcp'
  const usingGCP = !clusterConfig || clusterConfig.cloudProvider === CloudProvider.GCP
  let clusterName = usingGCP ? fetchEnv(envVar.KUBERNETES_CLUSTER_NAME) : clusterConfig!.clusterName
  let gcloudProject, gcloudRegion

  if (context) {
    gcloudProject = getDynamicEnvVarValue(
      DynamicEnvVar.PROM_GCP_PROJECT,
      { context },
      fetchEnv(envVar.TESTNET_PROJECT_NAME)
    )
    gcloudRegion = getDynamicEnvVarValue(
      DynamicEnvVar.PROM_GCP_REGION,
      { context },
      fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)
    )
    clusterName = getDynamicEnvVarValue(
      DynamicEnvVar.KUBERNETES_CLUSTER_NAME,
      { context },
      clusterName
    )
  } else {
    gcloudProject = fetchEnv(envVar.TESTNET_PROJECT_NAME)
    gcloudRegion = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)
  }

  return [cloudProvider, clusterName, gcloudProject, gcloudRegion, usingGCP]
}

function getRemoteWriteParameters(context?: string): string[] {
  const remoteWriteUrl = getDynamicEnvVarValue(
    DynamicEnvVar.PROM_REMOTE_WRITE_URL,
    { context },
    fetchEnv(envVar.PROMETHEUS_REMOTE_WRITE_URL)
  )
  const remoteWriteUser = getDynamicEnvVarValue(
    DynamicEnvVar.PROM_REMOTE_WRITE_USERNAME,
    { context },
    fetchEnv(envVar.PROMETHEUS_REMOTE_WRITE_USERNAME)
  )
  const remoteWritePassword = getDynamicEnvVarValue(
    DynamicEnvVar.PROM_REMOTE_WRITE_PASSWORD,
    { context },
    fetchEnv(envVar.PROMETHEUS_REMOTE_WRITE_PASSWORD)
  )
  return [
    `--set remote_write.url='${remoteWriteUrl}'`,
    `--set remote_write.basic_auth.username='${remoteWriteUser}'`,
    `--set remote_write.basic_auth.password='${remoteWritePassword}'`,
  ]
}

async function helmParameters(context?: string, clusterConfig?: BaseClusterConfig) {
  const [clusterName, gcloudProject, gcloudRegion, usingGCP] = getK8sContextVars(
    clusterConfig,
    context
  )

  const params = [
    `--set namespace=${kubeNamespace}`,
    `--set gcloud.project=${gcloudProject}`,
    `--set gcloud.region=${gcloudRegion}`,
    `--set prometheus.imageTag=${prometheusImageTag}`,
    `--set serviceAccount.name=${kubeServiceAccountName}`,
    `--set cluster=${clusterName}`,
  ]

  // Remote write to Grafana Cloud
  if (fetchEnvOrFallback(envVar.PROMETHEUS_REMOTE_WRITE_URL, '') !== '') {
    params.push(...getRemoteWriteParameters(context))
  }

  if (usingGCP) {
    // Note: ssd is not the default storageClass in GCP clusters
    params.push(`--set storageClassName=ssd`)
  } else if (context?.startsWith('AZURE_ODIS')) {
    params.push(`--set storageClassName=default`)
  }

  // Set scrape job if set for the context
  if (context) {
    const scrapeJobName = getDynamicEnvVarValue(DynamicEnvVar.PROM_SCRAPE_JOB_NAME, { context }, '')
    const scrapeTargets = getDynamicEnvVarValue(DynamicEnvVar.PROM_SCRAPE_TARGETS, { context }, '')
    const scrapeLabels = getDynamicEnvVarValue(DynamicEnvVar.PROM_SCRAPE_LABELS, { context }, '')

    if (scrapeJobName !== '') {
      params.push(`--set scrapeJob.Name=${scrapeJobName}`)
    }

    if (scrapeTargets !== '') {
      const targetParams = setHelmArray('scrapeJob.Targets', scrapeTargets.split(','))
      params.push(...targetParams)
    }

    if (scrapeLabels !== '') {
      const labelParams = setHelmArray('scrapeJob.Labels', scrapeLabels.split(','))
      params.push(...labelParams)
    }
  }

  return params
}

function getCloudProviderPrefix(clusterConfig: BaseClusterConfig) {
  const prefixByCloudProvider: { [key in CloudProvider]: string } = {
    [CloudProvider.AWS]: 'aws',
    [CloudProvider.AZURE]: 'aks',
    [CloudProvider.GCP]: 'gcp',
  }
  return prefixByCloudProvider[clusterConfig.cloudProvider]
}

export async function installGrafanaIfNotExists(
  context?: string,
  clusterConfig?: BaseClusterConfig
) {
  const grafanaExists = await outputIncludes(
    `helm list -A`,
    grafanaReleaseName,
    `grafana exists, skipping install`
  )
  if (!grafanaExists) {
    console.info('Installing grafana')
    await installGrafana(context, clusterConfig)
  }
}

async function installGrafana(context?: string, clusterConfig?: BaseClusterConfig) {
  await helmAddRepoAndUpdate('https://grafana.github.io/helm-charts', 'grafana')
  await createNamespaceIfNotExists(kubeNamespace)
  return installGenericHelmChart({
    namespace: kubeNamespace,
    releaseName: grafanaReleaseName,
    chartDir: grafanaHelmRepo,
    parameters: await grafanaHelmParameters(context, clusterConfig),
    buildDependencies: false,
    valuesOverrideFile: '../helm-charts/grafana/values-clabs.yaml',
  })
}

export async function upgradeGrafana(context?: string, clusterConfig?: BaseClusterConfig) {
  await helmAddRepoAndUpdate('https://grafana.github.io/helm-charts', 'grafana')
  await createNamespaceIfNotExists(kubeNamespace)
  return upgradeGenericHelmChart({
    namespace: kubeNamespace,
    releaseName: grafanaReleaseName,
    chartDir: grafanaHelmRepo,
    parameters: await grafanaHelmParameters(context, clusterConfig),
    buildDependencies: false,
    // Adding this file and clabs' default values file.
    valuesOverrideFile: '../helm-charts/grafana/values-clabs.yaml',
  })
}

export async function removeGrafanaHelmRelease() {
  const grafanaExists = await outputIncludes(`helm list -A`, grafanaReleaseName)
  if (grafanaExists) {
    console.info('Removing grafana')
    await removeGenericHelmChart(grafanaReleaseName, kubeNamespace)
  }
}

async function grafanaHelmParameters(context?: string, clusterConfig?: BaseClusterConfig) {
  // Grafana chart is a copy from source. No changes done directly on the chart.
  const [k8sClusterName] = getK8sContextVars(clusterConfig, context)
  const k8sDomainName = fetchEnv(envVar.CLUSTER_DOMAIN_NAME)
  // Rename baklavastaging -> baklava
  const grafanaUrl =
    k8sClusterName !== 'baklavastaging'
      ? `${k8sClusterName}-grafana.${k8sDomainName}.org`
      : `baklava-grafana.${k8sDomainName}.org`
  const values = {
    adminPassword: fetchEnv(envVar.GRAFANA_LOCAL_ADMIN_PASSWORD),
    'grafana.ini': {
      server: {
        root_url: `https://${grafanaUrl}`,
      },
      'auth.google': {
        client_id: fetchEnv(envVar.GRAFANA_LOCAL_OAUTH2_CLIENT_ID),
        client_secret: fetchEnv(envVar.GRAFANA_LOCAL_OAUTH2_CLIENT_SECRET),
      },
    },
    ingress: {
      hosts: [grafanaUrl],
      tls: [
        {
          secretName: `${k8sClusterName}-grafana-tls`,
          hosts: [grafanaUrl],
        },
      ],
    },
  }

  const valuesFile = '/tmp/grafana-values.yaml'
  fs.writeFileSync(valuesFile, yaml.safeDump(values))

  // Adding this file and clabs' default values file.
  const params = [`-f ${valuesFile} --version ${grafanaChartVersion}`]
  return params
}
