import sleep from 'sleep-promise'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { scaleResource } from 'src/lib/kubernetes'
import {
  getInternalProxyIPs,
  getInternalTxNodeIPs,
  getInternalValidatorIPs,
} from 'src/lib/vm-testnet-utils'

const helmChartPath = '../helm-charts/prometheus-to-sd'

// This deploys a helm chart to Kubernetes that exports prometheus metrics from
// VM testnets Stackdriver

export async function installHelmChart(celoEnv: string) {
  return installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv)
  )
}

export async function removeHelmRelease(celoEnv: string) {
  await removeGenericHelmChart(releaseName(celoEnv))
}

export async function upgradeHelmChart(celoEnv: string) {
  console.info(`Upgrading helm release ${releaseName(celoEnv)}`)

  const statefulSetName = `${celoEnv}-prom-to-sd`

  console.info('Scaling StatefulSet down to 0...')
  await scaleResource(celoEnv, 'statefulset', statefulSetName, 0)
  await sleep(10000)

  const helmParams = await helmParameters(celoEnv)

  const upgradeCmdArgs = `${releaseName(
    celoEnv
  )} ${helmChartPath} --namespace ${celoEnv} ${helmParams.join(' ')}`

  if (process.env.CELOTOOL_VERBOSE === 'true') {
    await execCmdWithExitOnFailure(`helm upgrade --debug --dry-run ${upgradeCmdArgs}`)
  }
  await execCmdWithExitOnFailure(`helm upgrade ${upgradeCmdArgs}`)
  console.info(`Helm release ${releaseName(celoEnv)} upgrade successful`)

  const replicaCount = getReplicaCount()

  console.info(`Scaling StatefulSet back up to ${replicaCount}...`)
  await scaleResource(celoEnv, 'statefulset', statefulSetName, replicaCount)
}

async function helmParameters(celoEnv: string) {
  // The metrics endpoints are only exposed internally
  const validatorIpAddresses = await getInternalValidatorIPs(celoEnv)
  const validatorCount = parseInt(fetchEnv(envVar.VALIDATORS), 10)
  const validatorPodIds = []
  for (let i = 0; i < validatorCount; i++) {
    validatorPodIds.push(`${celoEnv}-validator-${i}`)
  }

  const proxyIpAddresses = await getInternalProxyIPs(celoEnv)
  const proxyCount = parseInt(fetchEnv(envVar.PROXIED_VALIDATORS), 10)
  const proxyPodIds = []
  for (let i = 0; i < proxyCount; i++) {
    proxyPodIds.push(`${celoEnv}-proxy-${i}`)
  }

  const txNodeIpAddresses = await getInternalTxNodeIPs(celoEnv)
  const txNodeCount = parseInt(fetchEnv(envVar.TX_NODES), 10)
  const txNodePodIds = []
  for (let i = 0; i < txNodeCount; i++) {
    txNodePodIds.push(`${celoEnv}-tx-node-${i}`)
  }

  const allIps = [...validatorIpAddresses, ...proxyIpAddresses, ...txNodeIpAddresses]
  const sources = allIps.map((ip: string) => `http://${ip}:9200/metrics`)

  const allPodIds = [...validatorPodIds, ...proxyPodIds, ...txNodePodIds]

  return [
    `--set metricsSources.geth="${sources.join('\\,')}"`,
    `--set promtosd.scrape_interval=${fetchEnv(envVar.PROMTOSD_SCRAPE_INTERVAL)}`,
    `--set promtosd.export_interval=${fetchEnv(envVar.PROMTOSD_EXPORT_INTERVAL)}`,
    `--set promtosd.podIds="${allPodIds.join('\\,')}"`,
    `--set promtosd.namespaceId=${celoEnv}`,
    `--set replicaCount=${getReplicaCount()}`,
  ]
}

function getReplicaCount() {
  const txNodeCount = parseInt(fetchEnv(envVar.TX_NODES), 10)
  const validatorCount = parseInt(fetchEnv(envVar.VALIDATORS), 10)
  const proxyCount = parseInt(fetchEnv(envVar.PROXIED_VALIDATORS), 10)

  return txNodeCount + validatorCount + proxyCount
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-prom-to-sd`
}
