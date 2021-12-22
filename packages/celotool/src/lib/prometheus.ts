import fs from 'fs'
import { createNamespaceIfNotExists } from './cluster'
import { execCmd, execCmdWithExitOnFailure } from './cmd-utils'
import {
  DynamicEnvVar,
  envVar,
  fetchEnv,
  fetchEnvOrFallback,
  getDynamicEnvVarValue,
} from './env-utils'
import {
  installGenericHelmChart,
  isCelotoolHelmDryRun,
  removeGenericHelmChart,
  setHelmArray,
  upgradeGenericHelmChart,
} from './helm_deploy'
import { BaseClusterConfig, CloudProvider } from './k8s-cluster/base'
import { GCPClusterConfig } from './k8s-cluster/gcp'
import {
  createServiceAccountIfNotExists,
  getServiceAccountEmail,
  getServiceAccountKey,
  setupGKEWorkloadIdentities,
} from './service-account-utils'
import { outputIncludes, switchToGCPProject } from './utils'
const yaml = require('js-yaml')

const helmChartPath = '../helm-charts/prometheus-stackdriver'
const releaseName = 'prometheus-stackdriver'
const kubeNamespace = 'prometheus'
const kubeServiceAccountName = releaseName
// stackdriver-prometheus-sidecar relevant links:
// GitHub: https://github.com/Stackdriver/stackdriver-prometheus-sidecar
// Container registry with latest tags: https://console.cloud.google.com/gcr/images/stackdriver-prometheus/GLOBAL/stackdriver-prometheus-sidecar?gcrImageListsize=30
const sidecarImageTag = '0.8.2'
// Prometheus container registry with latest tags: https://hub.docker.com/r/prom/prometheus/tags
const prometheusImageTag = 'v2.27.1'

const GKEWorkloadMetricsHelmChartPath = '../helm-charts/gke-workload-metrics'
const GKEWorkloadMetricsReleaseName = 'gke-workload-metrics'

const grafanaHelmChartPath = '../helm-charts/grafana'
const grafanaReleaseName = 'grafana'

export async function installPrometheusIfNotExists(
  context?: string,
  clusterConfig?: BaseClusterConfig,
  disableStackdriver?: boolean
) {
  const prometheusExists = await outputIncludes(
    `helm list -n prometheus`,
    releaseName,
    `prometheus-stackdriver exists, skipping install`
  )
  if (!prometheusExists) {
    console.info('Installing prometheus-stackdriver')
    await installPrometheus(context, clusterConfig, disableStackdriver)
  }
}

async function installPrometheus(
  context?: string,
  clusterConfig?: BaseClusterConfig,
  disableStackdriver?: boolean
) {
  await createNamespaceIfNotExists(kubeNamespace)
  return installGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(context, clusterConfig, disableStackdriver)
  )
}

export async function removePrometheus() {
  await removeGenericHelmChart(releaseName, kubeNamespace)
}

export async function upgradePrometheus(
  context?: string,
  clusterConfig?: BaseClusterConfig,
  disableStackdriver?: boolean
) {
  await createNamespaceIfNotExists(kubeNamespace)
  return upgradeGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(context, clusterConfig, disableStackdriver)
  )
}

async function helmParameters(
  context?: string,
  clusterConfig?: BaseClusterConfig,
  disableStackdriver?: boolean
) {
  const usingGCP = !clusterConfig || clusterConfig.cloudProvider === CloudProvider.GCP
  const clusterName = usingGCP
    ? fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)
    : clusterConfig!.clusterName
  let gcloudProject
  let gcloudRegion
  if (context) {
    gcloudProject = getDynamicEnvVarValue(
      DynamicEnvVar.PROM_SIDECAR_GCP_PROJECT,
      { context },
      fetchEnv(envVar.TESTNET_PROJECT_NAME)
    )
    gcloudRegion = getDynamicEnvVarValue(
      DynamicEnvVar.PROM_SIDECAR_GCP_REGION,
      { context },
      fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)
    )
  } else {
    gcloudProject = fetchEnv(envVar.TESTNET_PROJECT_NAME)
    gcloudRegion = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)
  }

  const params = [
    `--set namespace=${kubeNamespace}`,
    `--set gcloud.project=${gcloudProject}`,
    `--set gcloud.region=${gcloudRegion}`,
    `--set prometheus.imageTag=${prometheusImageTag}`,
    `--set serviceAccount.name=${kubeServiceAccountName}`,
    `--set cluster=${clusterName}`,
  ]

  // Remote write to Grafana.
  if (fetchEnvOrFallback(envVar.PROMETHEUS_REMOTE_WRITE_URL, '') !== '') {
    params.push(
      `--set remote_write.url='${fetchEnv(envVar.PROMETHEUS_REMOTE_WRITE_URL)}'`,
      `--set remote_write.basic_auth.username='${fetchEnv(
        envVar.PROMETHEUS_REMOTE_WRITE_USERNAME
      )}'`,
      `--set remote_write.basic_auth.password='${fetchEnv(
        envVar.PROMETHEUS_REMOTE_WRITE_PASSWORD
      )}'`
    )
  }

  params.push(`--set stackdriver.enable='${!disableStackdriver}'`)
  if (!disableStackdriver) {
    params.push(`--set stackdriver.sidecar.imageTag=${sidecarImageTag}`)

    if (usingGCP) {
      params.push(
        `--set stackdriver.metricsPrefix=external.googleapis.com/prometheus/${clusterName}`
      )
    } else {
      const cloudProvider = getCloudProviderPrefix(clusterConfig!)
      params.push(
        `--set stackdriver.metricsPrefix=external.googleapis.com/prometheus/${
          clusterConfig!.clusterName
        }`,
        `--set stackdriver.gcloudServiceAccountKeyBase64=${await getPrometheusGcloudServiceAccountKeyBase64(
          clusterName,
          cloudProvider,
          gcloudProject
        )}`
      )
    }
  }

  if (usingGCP) {
    const gcloudProjectName = fetchEnv(envVar.TESTNET_PROJECT_NAME)
    const cloudProvider = 'gcp'
    const serviceAccountName = getServiceAccountName(clusterName, cloudProvider)
    await createPrometheusGcloudServiceAccount(serviceAccountName, gcloudProjectName)
    console.info(serviceAccountName)
    const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
    params.push(
      `--set storageClassName=ssd`,
      `--set serviceAccount.annotations.'iam\\\.gke\\\.io/gcp-service-account'=${serviceAccountEmail}`
    )
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

async function getPrometheusGcloudServiceAccountKeyBase64(
  clusterName: string,
  cloudProvider: string,
  gcloudProjectName: string
) {
  // First check if value already exist in helm release. If so we pass the same value
  // and we avoid creating a new key for the service account
  const gcloudServiceAccountKeyBase64 = await getPrometheusGcloudServiceAccountKeyBase64FromHelm()
  if (gcloudServiceAccountKeyBase64) {
    return gcloudServiceAccountKeyBase64
  } else {
    // We do not have the service account key in helm so we need to create the SA (if it does not exist)
    // and create a new key for the service account in any case
    await switchToGCPProject(gcloudProjectName)
    const serviceAccountName = getServiceAccountName(clusterName, cloudProvider)
    await createPrometheusGcloudServiceAccount(serviceAccountName, gcloudProjectName)
    const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
    const serviceAccountKeyPath = `/tmp/gcloud-key-${serviceAccountName}.json`
    await getServiceAccountKey(serviceAccountEmail, serviceAccountKeyPath)
    return fs.readFileSync(serviceAccountKeyPath).toString('base64')
  }
}

async function getPrometheusGcloudServiceAccountKeyBase64FromHelm() {
  const prometheusInstalled = await outputIncludes(
    `helm list -n ${kubeNamespace}`,
    `${releaseName}`
  )
  if (prometheusInstalled) {
    const [output] = await execCmd(`helm get values -n ${kubeNamespace} ${releaseName}`)
    const prometheusValues: any = yaml.safeLoad(output)
    return prometheusValues.gcloudServiceAccountKeyBase64
  }
}

// createPrometheusGcloudServiceAccount creates a gcloud service account with a given
// name and the proper permissions for writing metrics to stackdriver
async function createPrometheusGcloudServiceAccount(
  serviceAccountName: string,
  gcloudProjectName: string
) {
  await execCmdWithExitOnFailure(`gcloud config set project ${gcloudProjectName}`)
  const accountCreated = await createServiceAccountIfNotExists(
    serviceAccountName,
    gcloudProjectName
  )
  if (accountCreated) {
    let serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
    while (!serviceAccountEmail) {
      serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
    }
    await execCmdWithExitOnFailure(
      `gcloud projects add-iam-policy-binding ${gcloudProjectName} --role roles/monitoring.metricWriter --member serviceAccount:${serviceAccountEmail}`
    )
    // Prometheus needs roles/compute.viewer to discover the VMs asking GCE API
    await execCmdWithExitOnFailure(
      `gcloud projects add-iam-policy-binding ${gcloudProjectName} --role roles/compute.viewer --member serviceAccount:${serviceAccountEmail}`
    )

    // Setup workload identity IAM permissions
    await setupGKEWorkloadIdentities(
      serviceAccountName,
      gcloudProjectName,
      kubeNamespace,
      kubeServiceAccountName
    )
  }
}

function getCloudProviderPrefix(clusterConfig: BaseClusterConfig) {
  const prefixByCloudProvider: { [key in CloudProvider]: string } = {
    [CloudProvider.AWS]: 'aws',
    [CloudProvider.AZURE]: 'aks',
    [CloudProvider.GCP]: 'gcp',
  }
  return prefixByCloudProvider[clusterConfig.cloudProvider]
}

function getServiceAccountName(clusterName: string, cloudProvider: string) {
  // Ensure the service account name is within the length restriction
  // and ends with an alphanumeric character
  return `prometheus-${cloudProvider}-${clusterName}`
    .substring(0, 30)
    .replace(/[^a-zA-Z0-9]+$/g, '')
}

export async function installGrafanaIfNotExists() {
  const grafanaExists = await outputIncludes(
    `helm list -A`,
    grafanaReleaseName,
    `grafana exists, skipping install`
  )
  if (!grafanaExists) {
    console.info('Installing grafana')
    await installGrafana()
  }
}

async function installGrafana() {
  await createNamespaceIfNotExists(kubeNamespace)
  return installGenericHelmChart(
    kubeNamespace,
    grafanaReleaseName,
    grafanaHelmChartPath,
    await grafanaHelmParameters()
  )
}

async function grafanaHelmParameters() {
  const k8sClusterName = fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)
  const k8sDomainName = fetchEnv(envVar.CLUSTER_DOMAIN_NAME)
  const values = {
    annotations: {
      'prometheus.io/scrape': 'false',
      'prometheus.io/path': '/metrics',
      'prometheus.io/port': '3000',
    },
    sidecar: {
      dashboards: {
        enabled: true,
      },
      datasources: {
        enabled: false,
      },
      notifiers: {
        enabled: false,
      },
    },
    ingress: {
      enabled: true,
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        'kubernetes.io/tls-acme': 'true',
      },
      hosts: [`${k8sClusterName}-grafana.${k8sDomainName}.org`],
      path: '/',
      tls: [
        {
          secretName: `${k8sClusterName}-grafana-tls`,
          hosts: [`${k8sClusterName}-grafana.${k8sDomainName}.org`],
        },
      ],
    },
    persistence: {
      enabled: true,
      size: '10Gi',
      storageClassName: 'ssd',
    },
    datasources: {
      'datasources.yaml': {
        apiVersion: 1,
        datasources: [
          {
            name: 'Prometheus',
            type: 'prometheus',
            url: 'http://prometheus-server.prometheus:9090',
            access: 'proxy',
            isDefault: true,
          },
        ],
      },
    },
  }

  const valuesFile = '/tmp/grafana-values.yaml'
  fs.writeFileSync(valuesFile, yaml.safeDump(values))

  const params = [`-f ${valuesFile}`]
  return params
}

export async function upgradeGrafana() {
  await createNamespaceIfNotExists(kubeNamespace)
  return upgradeGenericHelmChart(
    kubeNamespace,
    grafanaReleaseName,
    grafanaHelmChartPath,
    await grafanaHelmParameters()
  )
}

export async function removeGrafanaHelmRelease() {
  const grafanaExists = await outputIncludes(`helm list -A`, grafanaReleaseName)
  if (grafanaExists) {
    console.info('Removing grafana')
    await removeGenericHelmChart(grafanaReleaseName, kubeNamespace)
  }
}

// See https://cloud.google.com/stackdriver/docs/solutions/gke/managing-metrics#enable-workload-metrics
async function enableGKESystemAndWorkloadMetrics(
  clusterID: string,
  zone: string,
  gcloudProjectName: string
) {
  const GKEWMEnabled = await outputIncludes(
    `gcloud beta container clusters describe ${clusterID} --zone=${zone} --project=${gcloudProjectName} --format="value(monitoringConfig.componentConfig.enableComponents)"`,
    'WORKLOADS',
    `GKE cluster ${clusterID} in zone ${zone} and project ${gcloudProjectName} has GKE workload metrics enabled, skipping gcloud beta container clusters update`
  )

  if (!GKEWMEnabled) {
    if (isCelotoolHelmDryRun()) {
      console.info(
        `Skipping enabling GKE workload metrics for cluster ${clusterID} in zone ${zone} and project ${gcloudProjectName} due to --helmdryrun`
      )
    } else {
      await execCmdWithExitOnFailure(
        `gcloud beta container clusters update ${clusterID} --zone=${zone} --project=${gcloudProjectName} --monitoring=SYSTEM,WORKLOAD`
      )
    }
  }
}

async function GKEWorkloadMetricsHelmParameters(clusterConfig?: BaseClusterConfig) {
  // Abandon if not using GCP, it's GKE specific.
  if (clusterConfig && clusterConfig.cloudProvider !== CloudProvider.GCP) {
    console.error('Cannot create gke-workload-metrics in a non GCP k8s cluster, skipping')
    process.exit(1)
  }

  const clusterName = clusterConfig
    ? clusterConfig!.clusterName
    : fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)

  const params = [`--set cluster=${clusterName}`]
  return params
}

export async function installGKEWorkloadMetricsIfNotExists(clusterConfig?: BaseClusterConfig) {
  const GKEWMExists = await outputIncludes(
    `helm list -A`,
    GKEWorkloadMetricsReleaseName,
    `gke-workload-metrics exists, skipping install`
  )
  if (!GKEWMExists) {
    console.info('Installing gke-workload-metrics')
    await installGKEWorkloadMetrics(clusterConfig)
  }
}

async function installGKEWorkloadMetrics(clusterConfig?: BaseClusterConfig) {
  // Abandon if not using GCP, it's GKE specific.
  if (clusterConfig && clusterConfig.cloudProvider !== CloudProvider.GCP) {
    console.error('Cannot create gke-workload-metrics in a non GCP k8s cluster, skipping')
    process.exit(1)
  }

  let k8sClusterName, k8sClusterZone, gcpProjectName
  if (clusterConfig) {
    const configGCP = clusterConfig as GCPClusterConfig
    k8sClusterName = configGCP!.clusterName
    k8sClusterZone = configGCP!.zone
    gcpProjectName = configGCP!.projectName
  } else {
    k8sClusterName = fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)
    k8sClusterZone = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)
    gcpProjectName = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  }

  await enableGKESystemAndWorkloadMetrics(k8sClusterName, k8sClusterZone, gcpProjectName)

  await createNamespaceIfNotExists(kubeNamespace)
  return installGenericHelmChart(
    kubeNamespace,
    GKEWorkloadMetricsReleaseName,
    GKEWorkloadMetricsHelmChartPath,
    await GKEWorkloadMetricsHelmParameters(clusterConfig)
  )
}

export async function upgradeGKEWorkloadMetrics(clusterConfig?: BaseClusterConfig) {
  const params = await GKEWorkloadMetricsHelmParameters(clusterConfig)

  await createNamespaceIfNotExists(kubeNamespace)
  return upgradeGenericHelmChart(
    kubeNamespace,
    GKEWorkloadMetricsReleaseName,
    GKEWorkloadMetricsHelmChartPath,
    params
  )
}

export async function removeGKEWorkloadMetrics() {
  const GKEWMExists = await outputIncludes(`helm list -A`, GKEWorkloadMetricsReleaseName)
  if (GKEWMExists) {
    console.info('Removing gke-workload-metrics')
    await removeGenericHelmChart(GKEWorkloadMetricsReleaseName, kubeNamespace)
  }
}
