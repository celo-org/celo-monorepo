import fs from 'fs'
import { createNamespaceIfNotExists } from './cluster'
import { execCmdWithExitOnFailure } from './cmd-utils'
import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from './helm_deploy'
import { BaseClusterConfig, CloudProvider } from './k8s-cluster/base'
import {
  createServiceAccountIfNotExists,
  getServiceAccountEmail,
  getServiceAccountKey,
} from './service-account-utils'
import { outputIncludes, switchToProjectFromEnv as switchToGCPProjectFromEnv } from './utils'
const yaml = require('js-yaml')

const helmChartPath = '../helm-charts/prometheus-stackdriver'
const releaseName = 'prometheus-stackdriver'
const kubeNamespace = 'prometheus'
const kubeServiceAccountName = releaseName
// stackdriver-prometheus-sidecar relevant links:
// GitHub: https://github.com/Stackdriver/stackdriver-prometheus-sidecar
// Container registry with latest tags: https://console.cloud.google.com/gcr/images/stackdriver-prometheus/GLOBAL/stackdriver-prometheus-sidecar?gcrImageListsize=30
const sidecarImageTag = '0.8.0'
// Prometheus container registry with latest tags: https://hub.docker.com/r/prom/prometheus/tags
const prometheusImageTag = 'v2.22.2'

const grafanaHelmChartPath = '../helm-charts/grafana'
const grafanaReleaseName = 'grafana'

export async function installPrometheusIfNotExists(clusterConfig?: BaseClusterConfig) {
  const prometheusExists = await outputIncludes(
    `helm list -n prometheus`,
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
  // nginx metrics currently breaks sidecar
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
    '__name__!~"workqueue_.+"',
    '__name__!~"nginx_.+"',
  ]
  const params = [
    `--set namespace=${kubeNamespace}`,
    `--set gcloud.project=${fetchEnv(envVar.TESTNET_PROJECT_NAME)}`,
    `--set cluster=${fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)}`,
    `--set gcloud.region=${fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)}`,
    `--set sidecar.imageTag=${sidecarImageTag}`,
    `--set prometheus.imageTag=${prometheusImageTag}`,
    `--set stackdriver_metrics_prefix=${prometheusImageTag}`,
    `--set serviceAccount.name=${kubeServiceAccountName}`,
    // Stackdriver allows a maximum of 10 custom labels. kube-state-metrics
    // has some metrics of the form "kube_.+_labels" that provides the labels
    // of k8s resources as metric labels. If some k8s resources have too many labels,
    // this results in a bunch of errors when the sidecar tries to send metrics to Stackdriver.
    `--set-string includeFilter='\\{job=~".+"\\,${exclusions.join('\\,')}\\}'`,
  ]
  if (clusterConfig && clusterConfig.cloudProvider !== CloudProvider.GCP) {
    const clusterName = clusterConfig.clusterName
    const cloudProvider = getCloudProviderPrefix(clusterConfig)
    params.push(
      `--set cluster=${clusterConfig.clusterName}`,
      `--set stackdriver_metrics_prefix=external.googleapis.com/prometheus/${clusterConfig.clusterName}`,
      `--set gcloudServiceAccountKeyBase64=${await getPrometheusGcloudServiceAccountKeyBase64(
        clusterName,
        cloudProvider
      )}`
    )
  } else {
    // GCP
    const clusterName = fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)
    const gcloudProjectName = fetchEnv(envVar.TESTNET_PROJECT_NAME)
    const cloudProvider = 'gcp'
    const serviceAccountName = getServiceAccountName(clusterName, cloudProvider)
    await createPrometheusGcloudServiceAccount(serviceAccountName, gcloudProjectName)
    console.info(serviceAccountName)
    const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
    params.push(
      `--set cluster=${clusterName}`,
      `--set storageClassName=ssd`,
      `--set stackdriver_metrics_prefix=external.googleapis.com/prometheus/${clusterName}`,
      `--set serviceAccount.annotations.'iam\\\.gke\\\.io/gcp-service-account'=${serviceAccountEmail}`
    )
    if (fetchEnvOrFallback(envVar.PROMETHEUS_GCE_SCRAPE_REGIONS, '')) {
      params.push(`--set gcloud.gceScrapeZones={${fetchEnv(envVar.PROMETHEUS_GCE_SCRAPE_REGIONS)}}`)
    }
  }
  return params
}

async function getPrometheusGcloudServiceAccountKeyBase64(
  clusterName: string,
  cloudProvider: string
) {
  await switchToGCPProjectFromEnv()
  const gcloudProjectName = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  const serviceAccountName = getServiceAccountName(clusterName, cloudProvider)

  await createPrometheusGcloudServiceAccount(serviceAccountName, gcloudProjectName)

  const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
  const serviceAccountKeyPath = `/tmp/gcloud-key-${serviceAccountName}.json`
  await getServiceAccountKey(serviceAccountEmail, serviceAccountKeyPath)
  return fs.readFileSync(serviceAccountKeyPath).toString('base64')
}

// createPrometheusGcloudServiceAccount creates a gcloud service account with a given
// name and the proper permissions for writing metrics to stackdriver
async function createPrometheusGcloudServiceAccount(
  serviceAccountName: string,
  gcloudProjectName: string
) {
  await execCmdWithExitOnFailure(`gcloud config set project ${gcloudProjectName}`)
  const accountCreated = await createServiceAccountIfNotExists(serviceAccountName)
  if (accountCreated) {
    let serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
    while (!serviceAccountEmail) {
      serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
    }
    await execCmdWithExitOnFailure(
      `gcloud projects add-iam-policy-binding ${gcloudProjectName} --role roles/monitoring.metricWriter --member serviceAccount:${serviceAccountEmail}`
    )
    // Setup workload identity IAM permissions
    await setupWorkloadIdentities(serviceAccountName, gcloudProjectName)
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

async function setupWorkloadIdentities(serviceAccountName: string, gcloudProjectName: string) {
  // https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity
  // Only grant access to GCE API to Prometheus SA deployed in GKE
  if (!serviceAccountName.includes('gcp')) {
    return
  }

  // Prometheus needs roles/compute.viewer to discover the VMs asking GCE API
  const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
  await execCmdWithExitOnFailure(
    `gcloud projects add-iam-policy-binding ${gcloudProjectName} --role roles/compute.viewer --member serviceAccount:${serviceAccountEmail}`
  )

  // Allow the Kubernetes service account to impersonate the Google service account
  await execCmdWithExitOnFailure(
    `gcloud iam --project ${gcloudProjectName} service-accounts add-iam-policy-binding \
    --role roles/iam.workloadIdentityUser \
    --member "serviceAccount:${gcloudProjectName}.svc.id.goog[${kubeNamespace}/${kubeServiceAccountName}]" \
    ${serviceAccountEmail}`
  )
}
