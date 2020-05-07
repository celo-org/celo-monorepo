import fs from 'fs'
import { createNamespaceIfNotExists } from './cluster'
import { envVar, fetchEnv } from './env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from './helm_deploy'
import {
  helmChartPath,
  kubeNamespace,
  prometheusImageTag,
  releaseName,
  sidecarImageTag,
} from './prometheus'
import {
  createServiceAccountIfNotExists,
  getServiceAccountEmail,
  getServiceAccountKey,
} from './service-account-utils'
import {
  execCmdWithExitOnFailure,
  switchToProjectFromEnv as switchToGCPProjectFromEnv,
} from './utils'

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
  await switchToGCPProjectFromEnv()

  const serviceAccountName = getServiceAccountName(kubeClusterName)
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

function getServiceAccountName(kubeClusterName: string) {
  return `prometheus-aks-${kubeClusterName}`
}
