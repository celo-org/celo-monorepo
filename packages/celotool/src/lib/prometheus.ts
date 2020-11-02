import fs from 'fs'
import { createNamespaceIfNotExists } from './cluster'
import { execCmdWithExitOnFailure } from './cmd-utils'
import { envVar, fetchEnv } from './env-utils'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart
} from './helm_deploy'
import { BaseClusterConfig, CloudProvider } from './k8s-cluster/base'
import {
  createServiceAccountIfNotExists,
  getServiceAccountEmail,
  getServiceAccountKey
} from './service-account-utils'
import { outputIncludes, switchToProjectFromEnv as switchToGCPProjectFromEnv } from './utils'

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

export async function installPrometheusIfNotExists(clusterConfig?: BaseClusterConfig) {
  const prometheusExists = await outputIncludes(
    `helm list -A`,
    releaseName,
    `prometheus-stackdriver exists, skipping install`
  )
  if (!prometheusExists) {
    console.info('Installing prometheus-stackdriver')
    await installPrometheus(clusterConfig)
  }
}

async function installPrometheus(clusterConfig?: BaseClusterConfig) {
  await createNamespaceIfNotExists(kubeNamespace)
  return installGenericHelmChart(
    kubeNamespace,
    releaseName,
    helmChartPath,
    await helmParameters(clusterConfig)
  )
}

export async function removeHelmRelease() {
  await removeGenericHelmChart(releaseName, kubeNamespace)
}

export async function upgradePrometheus() {
  await createNamespaceIfNotExists(kubeNamespace)
  return upgradeGenericHelmChart(kubeNamespace, releaseName, helmChartPath, await helmParameters())
}

async function helmParameters(clusterConfig?: BaseClusterConfig) {
  // To save $, don't send metrics to SD that probably won't be used
  const exclusions = [
    '__name__!~"kube_.+_labels"',
    '__name__!~"apiserver_.+"',
    '__name__!~"kube_certificatesigningrequest_.+"',
    '__name__!~"kube_configmap_.+"',
    '__name__!~"kube_cronjob_.+"',
    '__name__!~"kube_endpoint_.+"',
    '__name__!~"kube_horizontalpodautoscaler_.+"',
    '__name__!~"kube_ingress_.+"',
    '__name__!~"kube_job_.+"',
    '__name__!~"kube_lease_.+"',
    '__name__!~"kube_limitrange_.+"',
    '__name__!~"kube_mutatingwebhookconfiguration_.+"',
    '__name__!~"kube_namespace_.+"',
    '__name__!~"kube_networkpolicy_.+"',
    '__name__!~"kube_poddisruptionbudget_.+"',
    '__name__!~"kube_replicaset_.+"',
    '__name__!~"kube_replicationcontroller_.+"',
    '__name__!~"kube_resourcequota_.+"',
    '__name__!~"kube_secret_.+"',
    '__name__!~"kube_service_.+"',
    '__name__!~"kube_storageclass_.+"',
    '__name__!~"kube_service_.+"',
    '__name__!~"kube_validatingwebhookconfiguration_.+"',
    '__name__!~"kube_verticalpodautoscaler_.+"',
    '__name__!~"kube_volumeattachment_.+"',
    '__name__!~"kubelet_.+"',
    '__name__!~"phoenix_.+"',
    '__name__!~"workqueue_.+"'
  ]
  const params = [
    `--set namespace=${kubeNamespace}`,
    `--set gcloud.project=${fetchEnv(envVar.TESTNET_PROJECT_NAME)}`,
    `--set cluster=${fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)}`,
    `--set gcloud.region=${fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)}`,
    `--set sidecar.imageTag=${sidecarImageTag}`,
    `--set prometheus.imageTag=${prometheusImageTag}`,
    `--set stackdriver_metrics_prefix=${prometheusImageTag}`,
    // Stackdriver allows a maximum of 10 custom labels. kube-state-metrics
    // has some metrics of the form "kube_.+_labels" that provides the labels
    // of k8s resources as metric labels. If some k8s resources have too many labels,
    // this results in a bunch of errors when the sidecar tries to send metrics to Stackdriver.
    `--set-string includeFilter='\\{job=~".+"\\,${exclusions.join('\\,')}\\}'`,
  ]
  if (clusterConfig) {
    params.push(
      `--set cluster=${clusterConfig.clusterName}`,
      `--set stackdriver_metrics_prefix=external.googleapis.com/prometheus/${clusterConfig.clusterName}`,
      `--set gcloudServiceAccountKeyBase64=${await getPrometheusGcloudServiceAccountKeyBase64(
        clusterConfig
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

async function getPrometheusGcloudServiceAccountKeyBase64(clusterConfig: BaseClusterConfig) {
  await switchToGCPProjectFromEnv()

  const serviceAccountName = getServiceAccountName(clusterConfig)
  await createPrometheusGcloudServiceAccount(serviceAccountName)

  const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
  const serviceAccountKeyPath = `/tmp/gcloud-key-${serviceAccountName}.json`
  await getServiceAccountKey(serviceAccountEmail, serviceAccountKeyPath)
  return fs.readFileSync(serviceAccountKeyPath).toString('base64')
}

// createPrometheusGcloudServiceAccount creates a gcloud service account with a given
// name and the proper permissions for writing metrics to stackdriver
async function createPrometheusGcloudServiceAccount(serviceAccountName: string) {
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

function getServiceAccountName(clusterConfig: BaseClusterConfig) {
  const prefixByCloudProvider: { [key in CloudProvider]: string } = {
    [CloudProvider.AWS]: 'aws',
    [CloudProvider.AZURE]: 'aks',
    [CloudProvider.GCP]: 'gcp',
  }
  const prefix = prefixByCloudProvider[clusterConfig.cloudProvider]
  // Ensure the service account name is within the length restriction
  // and ends with an alphanumeric character
  return `prometheus-${prefix}-${clusterConfig.clusterName}`.substring(0, 30).replace(/[^a-zA-Z0-9]+$/g, '')
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
  const params = [
    `--set namespace=${kubeNamespace}`,
  ]
  return params
}

export async function upgradeGrafana() {
  await createNamespaceIfNotExists(kubeNamespace)
  return upgradeGenericHelmChart(kubeNamespace, grafanaReleaseName, grafanaHelmChartPath, await grafanaHelmParameters())
}

export async function removeGrafanaHelmRelease() {
  const grafanaExists = await outputIncludes(
    `helm list -A`,
    grafanaReleaseName,
  )
  if (grafanaExists) {
    console.info('Removing grafana')
    await removeGenericHelmChart(releaseName, kubeNamespace)
  }
}
