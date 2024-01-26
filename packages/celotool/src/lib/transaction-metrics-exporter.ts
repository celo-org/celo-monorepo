import { envVar, fetchEnv, fetchEnvOrFallback } from 'src/lib/env-utils'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'

const chartDir = '../helm-charts/transaction-metrics-exporter/'

function releaseName(celoEnv: string, suffix: string) {
  return `${celoEnv}-transaction-metrics-exporter-${suffix}`
}

export async function installHelmChart(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.TRANSACTION_METRICS_EXPORTER_SUFFIX, '1')
  await installGenericHelmChart({
    namespace: celoEnv,
    releaseName: releaseName(celoEnv, suffix),
    chartDir,
    parameters: await helmParameters(celoEnv),
  })
}

export async function upgradeHelmChart(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.TRANSACTION_METRICS_EXPORTER_SUFFIX, '1')
  await upgradeGenericHelmChart({
    namespace: celoEnv,
    releaseName: releaseName(celoEnv, suffix),
    chartDir,
    parameters: await helmParameters(celoEnv),
  })
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
  return params
}
