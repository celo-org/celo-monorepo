import fs from 'fs'
import { AzureClusterConfig } from './azure'
import { createNamespaceIfNotExists } from './cluster'
import { execCmdWithExitOnFailure } from './cmd-utils'
import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'
import {
  installGenericHelmChart,
  installUpgradeGenericChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart
} from './helm_deploy'
import {
  createServiceAccountIfNotExists,
  getServiceAccountEmail,
  getServiceAccountKey
} from './service-account-utils'
import { outputIncludes, switchToProjectFromEnv as switchToGCPProjectFromEnv } from './utils'
const yaml = require('js-yaml')

const helmChartPath = '../helm-charts/prometheus-stackdriver'
const releaseName = 'prometheus-stackdriver'
const kubeNamespace = 'prometheus'
// stackdriver-prometheus-sidecar relevant links:
// GitHub: https://github.com/Stackdriver/stackdriver-prometheus-sidecar
// Container registry with latest tags: https://console.cloud.google.com/gcr/images/stackdriver-prometheus/GLOBAL/stackdriver-prometheus-sidecar?gcrImageListsize=30
const sidecarImageTag = '0.7.3'
// Prometheus container registry with latest tags: https://hub.docker.com/r/prom/prometheus/tags
const prometheusImageTag = 'v2.17.0'

const grafanaHelmChartPath = '../helm-charts/grafana'
const grafanaReleaseName = 'grafana'

export async function installPrometheusIfNotExists(clusterConfig?: AzureClusterConfig) {
  const prometheusExists = await outputIncludes(
    `helm list`,
    releaseName,
    `prometheus-stackdriver exists, skipping install`
  )
  if (!prometheusExists) {
    console.info('Installing prometheus-stackdriver')
    await installPrometheus(clusterConfig)
  }
}

async function installPrometheus(clusterConfig?: AzureClusterConfig) {
  await createNamespaceIfNotExists(kubeNamespace)
  return installGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(clusterConfig)
  )
}

export async function removeHelmRelease() {
  await removeGenericHelmChart(releaseName)
}

export async function upgradePrometheus() {
  await createNamespaceIfNotExists(kubeNamespace)
  return upgradeGenericHelmChart(kubeNamespace, releaseName, helmChartPath, await helmParameters())
}

async function helmParameters(clusterConfig?: AzureClusterConfig) {
  const params = [
    `--set namespace=${kubeNamespace}`,
    `--set disableStackDriverMetrics=${fetchEnvOrFallback(envVar.DISABLE_FORWARD_METRICS_TO_STACKDRIVER, "false")}`,
    `--set gcloud.project=${fetchEnv(envVar.TESTNET_PROJECT_NAME)}`,
    `--set cluster=${fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)}`,
    `--set gcloud.region=${fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)}`,
    `--set sidecar.imageTag=${sidecarImageTag}`,
    `--set prometheus.imageTag=${prometheusImageTag}`,
    `--set stackdriver_metrics_prefix=${prometheusImageTag}`,
    `--set storageClassName=ssd`,
    `--set storageSize=50Gi`,
    `--set prometheus.retention_time=${fetchEnvOrFallback(envVar.PROMETHEUS_RETENTION_TIME, "7d")}`,
    // Stackdriver allows a maximum of 10 custom labels. kube-state-metrics
    // has some metrics of the form "kube_.+_labels" that provides the labels
    // of k8s resources as metric labels. If some k8s resources have too many labels,
    // this results in a bunch of errors when the sidecar tries to send metrics to Stackdriver.
    `--set-string includeFilter='\\{job=~".+"\\,__name__!~"kube_.+_labels"\\,__name__!~"phoenix_.+"\\}'`,
  ]
  if (clusterConfig) {
    params.push(
      `--set cluster=${clusterConfig.clusterName}`,
      `--set stackdriver_metrics_prefix=external.googleapis.com/prometheus/${clusterConfig.clusterName}`,
      `--set gcloudServiceAccountKeyBase64=${await getPrometheusGcloudServiceAccountKeyBase64forAKS(
        clusterConfig.clusterName
      )}`
    )
  } else {
    const clusterName = fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)
    params.push(
      `--set cluster=${clusterName}`,
      `--set stackdriver_metrics_prefix=external.googleapis.com/prometheus/${clusterName}`
    )
  }
  return params
}

async function getPrometheusGcloudServiceAccountKeyBase64forAKS(kubeClusterName: string) {
  await switchToGCPProjectFromEnv()

  const serviceAccountName = getServiceAccountNameforAKS(kubeClusterName)
  await createPrometheusGcloudServiceAccountforAKS(serviceAccountName)

  const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
  const serviceAccountKeyPath = `/tmp/gcloud-key-${serviceAccountName}.json`
  await getServiceAccountKey(serviceAccountEmail, serviceAccountKeyPath)
  return fs.readFileSync(serviceAccountKeyPath).toString('base64')
}

// createPrometheusGcloudServiceAccount creates a gcloud service account with a given
// name and the proper permissions for writing metrics to stackdriver
async function createPrometheusGcloudServiceAccountforAKS(serviceAccountName: string) {
  const gcloudProjectName = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  await execCmdWithExitOnFailure(`gcloud config set project ${gcloudProjectName}`)
  const accountCreated = await createServiceAccountIfNotExists(serviceAccountName)
  if (accountCreated) {
    const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
    await execCmdWithExitOnFailure(
      `gcloud projects add-iam-policy-binding ${gcloudProjectName} --role roles/monitoring.metricWriter --member serviceAccount:${serviceAccountEmail}`
    )
  }
}

function getServiceAccountNameforAKS(kubeClusterName: string) {
  // Ensure the service account name is within the length restriction
  // and ends with an alphanumeric character
  return `prometheus-aks-${kubeClusterName}`.substring(0, 30).replace(/[^a-zA-Z0-9]+$/g, '')
}

export async function installGrafanaIfNotExists() {
  const grafanaExists = await outputIncludes(
    `helm list`,
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
      "prometheus.io/scrape": "true",
      "prometheus.io/path":  "/metrics",
      "prometheus.io/port": "3000"
    },
    sidecar: {
      dashboards: {
        enabled: true
      },
      datasources: {
        enabled: false
      },
      notifiers: {
        enabled: false
      }
    },
    ingress: {
      enabled: true,
      annotations: {
        "kubernetes.io/ingress.class": "nginx",
        "kubernetes.io/tls-acme": "true"
      },
      hosts: [
        `${k8sClusterName}-grafana.${k8sDomainName}.org`
      ],
      path: '/',
      tls: [
        {
          secretName: `${k8sClusterName}-grafana-tls`,
          hosts: [
            `${k8sClusterName}-grafana.${k8sDomainName}.org`
          ]
        }
      ]
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
            isDefault: true
          }
        ]
      }
    }
  }

  const valuesFile = "/tmp/grafana-values.yaml"
  fs.writeFileSync(valuesFile,yaml.safeDump(values))

  const params = [
    `-f ${valuesFile}`
  ]
  return params
}

export async function upgradeGrafana() {
  await createNamespaceIfNotExists(kubeNamespace)
  return installUpgradeGenericChart(kubeNamespace, grafanaReleaseName, grafanaHelmChartPath, await grafanaHelmParameters())
}

export async function removeGrafanaHelmRelease() {
  const grafanaExists = await outputIncludes(
    `helm list`,
    grafanaReleaseName,
  )
  if (grafanaExists) {
    console.info('Removing grafana')
    await removeGenericHelmChart(releaseName)
  }
}
