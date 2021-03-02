import { envVar, fetchEnv, fetchEnvOrFallback, isVmBased } from 'src/lib/env-utils'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'
import { getInternalTxNodeLoadBalancerIP } from 'src/lib/vm-testnet-utils'

const chartDir = '../helm-charts/transaction-metrics-exporter/'

function releaseName(celoEnv: string, suffix: string) {
  return `${celoEnv}-transaction-metrics-exporter-${suffix}`
}

export async function installHelmChart(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.TRANSACTION_METRICS_EXPORTER_SUFFIX, '1')
  await installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv, suffix),
    chartDir,
    await helmParameters(celoEnv)
  )
}

export async function upgradeHelmChart(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.TRANSACTION_METRICS_EXPORTER_SUFFIX, '1')
  await upgradeGenericHelmChart(
    celoEnv,
    releaseName(celoEnv, suffix),
    chartDir,
    await helmParameters(celoEnv)
  )
}

export async function removeHelmRelease(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.TRANSACTION_METRICS_EXPORTER_SUFFIX, '1')
  await removeGenericHelmChart(releaseName(celoEnv, suffix), celoEnv)
}

async function helmParameters(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.TRANSACTION_METRICS_EXPORTER_SUFFIX, '1')
  const params = [
    `--namespace ${celoEnv}`,
    `--set environment="${celoEnv}"`,
    `--set imageRepository="${fetchEnv(
      envVar.TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_REPOSITORY
    )}"`,
    `--set imageTag="${fetchEnv(envVar.TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_TAG)}"`,
    `--set deploymentSuffix=${suffix}`,
    `--set fromBlock=${fetchEnvOrFallback(envVar.TRANSACTION_METRICS_EXPORTER_FROM_BLOCK, '0')}`,
    `--set toBlock=${fetchEnvOrFallback(envVar.TRANSACTION_METRICS_EXPORTER_FROM_BLOCK, '')}`,
    `--set blockInterval=${fetchEnvOrFallback(
      envVar.TRANSACTION_METRICS_EXPORTER_BLOCK_INTERVAL,
      '1'
    )}`,
    `--set watchAddress=${fetchEnvOrFallback(
      envVar.TRANSACTION_METRICS_EXPORTER_WATCH_ADDRESS,
      ''
    )}`,
  ]
  if (isVmBased()) {
    params.push(`--set web3Provider="ws://${await getInternalTxNodeLoadBalancerIP(celoEnv)}:8546"`)
  }
  return params
}
