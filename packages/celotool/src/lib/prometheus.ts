import { createNamespaceIfNotExists } from './cluster'
import { envVar, fetchEnv } from './env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from './helm_deploy'

export const helmChartPath = '../helm-charts/prometheus-stackdriver'
export const releaseName = 'prometheus-stackdriver'
export const kubeNamespace = 'prometheus'
// stackdriver-prometheus-sidecar relevant links:
// GitHub: https://github.com/Stackdriver/stackdriver-prometheus-sidecar
// Container registry with latest tags: https://console.cloud.google.com/gcr/images/stackdriver-prometheus/GLOBAL/stackdriver-prometheus-sidecar?gcrImageListsize=30
export const sidecarImageTag = '0.7.3'
// Prometheus container registry with latest tags: https://hub.docker.com/r/prom/prometheus/tags
export const prometheusImageTag = 'v2.17.0'

export async function installPrometheus() {
  await createNamespaceIfNotExists('prometheus')
  return installGenericHelmChart(kubeNamespace, releaseName, helmChartPath, await helmParameters())
}

export async function removeHelmRelease() {
  await removeGenericHelmChart(releaseName)
}

export function helmParameters() {
  const kubeClusterName = fetchEnv(envVar.AZURE_KUBERNETES_CLUSTER_NAME)
  return [
    `--set namespace=${kubeNamespace}`,
    `--set cluster=${kubeClusterName}`,
    `--set gcloud.project=${fetchEnv(envVar.TESTNET_PROJECT_NAME)}`,
    `--set gcloud.region=${fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)}`,
    `--set sidecar.imageTag=${sidecarImageTag}`,
    `--set prometheus.imageTag=${prometheusImageTag}`,
  ]
}
