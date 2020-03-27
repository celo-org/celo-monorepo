import fs from 'fs'
import { createNamespaceIfNotExists } from './cluster'
import { envVar, fetchEnv } from './env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from './helm_deploy'
import { execCmdWithExitOnFailure, outputIncludes } from './utils'

const helmChartPath = '../helm-charts/prometheus-stackdriver'
const releaseName = 'prometheus-stackdriver'
const kubeNamespace = 'prometheus'
// stackdriver-prometheus-sidecar relevant links:
// GitHub: https://github.com/Stackdriver/stackdriver-prometheus-sidecar
// Container registry with latest tags: https://console.cloud.google.com/gcr/images/stackdriver-prometheus/GLOBAL/stackdriver-prometheus-sidecar?gcrImageListsize=30
const sidecarImageTag = '0.7.3'
// Prometheus container registry with latest tags: https://hub.docker.com/r/prom/prometheus/tags
const prometheusImageTag = 'v2.17.0'

export async function installPrometheus() {
  await createNamespaceIfNotExists('prometheus')
  return installGenericHelmChart(kubeNamespace, releaseName, helmChartPath, await helmParameters())
}

export async function removeHelmRelease() {
  await removeGenericHelmChart(releaseName)
}

async function helmParameters() {
  const kubeClusterName = fetchEnv(envVar.AZURE_KUBERNETES_CLUSTER_NAME)
  return [
    `--set namespace=${kubeNamespace}`,
    `--set cluster=${kubeClusterName}`,
    `--set gcloud.project=${fetchEnv(envVar.TESTNET_PROJECT_NAME)}`,
    `--set gcloud.region=${fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)}`,
    `--set sidecar.imageTag=${sidecarImageTag}`,
    `--set prometheus.imageTag=${prometheusImageTag}`,
    `--set gcloudServiceAccountKeyBase64=${await getPrometheusGcloudServiceAccountKeyBase64(
      kubeClusterName
    )}`,
  ]
}

async function getPrometheusGcloudServiceAccountKeyBase64(kubeClusterName: string) {
  const serviceAccountName = getServiceAccountName(kubeClusterName)
  await createPrometheusGcloudServiceAccount(serviceAccountName)

  const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
  const serviceAccountKeyPath = `/tmp/gcloud-key-${serviceAccountName}.json`
  await execCmdWithExitOnFailure(
    `gcloud iam service-accounts keys create ${serviceAccountKeyPath} --iam-account ${serviceAccountEmail}`
  )
  return fs.readFileSync(serviceAccountKeyPath).toString('base64')
}

// createPrometheusGcloudServiceAccount creates a gcloud service account with a given
// name and the proper permissions for writing metrics to stackdriver
async function createPrometheusGcloudServiceAccount(serviceAccountName: string) {
  const gcloudProjectName = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  await execCmdWithExitOnFailure(`gcloud config set project ${gcloudProjectName}`)
  const serviceAccountExists = await outputIncludes(
    `gcloud iam service-accounts list --filter=NAME=${serviceAccountName}`,
    serviceAccountName,
    `Service account ${serviceAccountName} exists`
  )
  if (serviceAccountExists) {
    return
  }
  await execCmdWithExitOnFailure(
    `gcloud iam service-accounts create ${serviceAccountName} --display-name ${serviceAccountName}`
  )
  const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
  await execCmdWithExitOnFailure(
    `gcloud projects add-iam-policy-binding ${gcloudProjectName} --role roles/monitoring.metricWriter --member serviceAccount:${serviceAccountEmail}`
  )
}

function getServiceAccountName(kubeClusterName: string) {
  return `prometheus-aks-${kubeClusterName}`
}

async function getServiceAccountEmail(serviceAccountName: string) {
  const [output] = await execCmdWithExitOnFailure(
    `gcloud iam service-accounts list --filter="displayName:${serviceAccountName}" --format='value[terminator=""](email)'`
  )
  return output
}
