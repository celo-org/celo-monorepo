import { envVar, fetchEnv, isVmBased } from 'src/lib/env-utils'
import { execCmdWithExitOnFailure } from 'src/lib/utils'
import { getTxNodeLoadBalancerIP } from 'src/lib/vm-testnet-utils'

export async function installHelmChart(celoEnv: string) {
  console.info(`Installing helm release ${celoEnv}-transaction-metrics-exporter`)
  const params = await helmParameters(celoEnv)
  await execCmdWithExitOnFailure(
    `helm install ../helm-charts/transaction-metrics-exporter/ --name ${celoEnv}-transaction-metrics-exporter ${params.join(
      ' '
    )}
  `
  )
}

export async function upgradeHelmChart(celoEnv: string) {
  console.info(`Upgrading helm release ${celoEnv}-transaction-metrics-exporter`)
  const params = await helmParameters(celoEnv)
  await execCmdWithExitOnFailure(
    `helm upgrade ${celoEnv}-transaction-metrics-exporter ../helm-charts/transaction-metrics-exporter/ ${params.join(
      ' '
    )}`
  )
}

export async function removeHelmRelease(celoEnv: string) {
  console.info(`Deleting helm chart ${celoEnv}-transaction-metrics-exporter`)
  await execCmdWithExitOnFailure(`helm del --purge ${celoEnv}-transaction-metrics-exporter`)
}

async function helmParameters(celoEnv: string) {
  const params = [
    `--namespace ${celoEnv}`,
    `--set environment="${celoEnv}"`,
    `--set imageRepository="${fetchEnv(
      envVar.TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_REPOSITORY
    )}"`,
    `--set imageTag="${fetchEnv(envVar.TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_TAG)}"`,
  ]
  if (isVmBased()) {
    params.push(`--set web3Provider="ws://${await getTxNodeLoadBalancerIP(celoEnv)}:8546"`)
  }
  return params
}
