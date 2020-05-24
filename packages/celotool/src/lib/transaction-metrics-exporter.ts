import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { envVar, fetchEnv, fetchEnvOrFallback, isVmBased } from 'src/lib/env-utils'
import { getInternalTxNodeLoadBalancerIP } from 'src/lib/vm-testnet-utils'

export async function installHelmChart(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.TRANSACTION_METRICS_EXPORTER_SUFFIX, '1')
  console.info(`Installing helm release ${celoEnv}-transaction-metrics-exporter-${suffix}`)
  const params = await helmParameters(celoEnv)
  await execCmdWithExitOnFailure(
    `helm install ../helm-charts/transaction-metrics-exporter/ --name ${celoEnv}-transaction-metrics-exporter-${suffix} ${params.join(
      ' '
    )}
  `
  )
}

export async function upgradeHelmChart(celoEnv: string) {
  console.info(`Upgrading helm release ${celoEnv}-transaction-metrics-exporter`)
  const suffix = fetchEnvOrFallback(envVar.TRANSACTION_METRICS_EXPORTER_SUFFIX, '1')
  const params = await helmParameters(celoEnv)
  await execCmdWithExitOnFailure(
    `helm upgrade ${celoEnv}-transaction-metrics-exporter-${suffix} ../helm-charts/transaction-metrics-exporter/ ${params.join(
      ' '
    )}`
  )
}

export async function removeHelmRelease(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.TRANSACTION_METRICS_EXPORTER_SUFFIX, '1')
  console.info(`Deleting helm chart ${celoEnv}-transaction-metrics-exporter-${suffix}`)
  await execCmdWithExitOnFailure(
    `helm del --purge ${celoEnv}-transaction-metrics-exporter-${suffix}`
  )
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
