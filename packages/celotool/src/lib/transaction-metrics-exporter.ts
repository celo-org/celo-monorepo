import { envVar, execCmdWithExitOnFailure, fetchEnv } from 'src/lib/utils'

export async function installHelmChart(celoEnv: string) {
  console.info(`Installing helm release ${celoEnv}-transaction-metrics-exporter`)
  await execCmdWithExitOnFailure(
    `helm install ../helm-charts/transaction-metrics-exporter/ --name ${celoEnv}-transaction-metrics-exporter ${helmParameters(
      celoEnv
    ).join(' ')}
  `
  )
}

export async function upgradeHelmChart(celoEnv: string) {
  console.info(`Upgrading helm release ${celoEnv}-transaction-metrics-exporter`)
  await execCmdWithExitOnFailure(
    `helm upgrade ${celoEnv}-transaction-metrics-exporter ../helm-charts/transaction-metrics-exporter/ ${helmParameters(
      celoEnv
    ).join(' ')}
  `
  )
}
export async function removeHelmRelease(celoEnv: string) {
  console.info(`Deleting helm chart ${celoEnv}-transaction-metrics-exporter`)
  await execCmdWithExitOnFailure(`helm del --purge ${celoEnv}-transaction-metrics-exporter`)
}

function helmParameters(celoEnv: string) {
  return [
    `--namespace ${celoEnv}`,
    `--set imageRepository=${fetchEnv(
      envVar.TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_REPOSITORY
    )}`,
    `--set imageTag=${fetchEnv(envVar.TRANSACTION_METRICS_EXPORTER_DOCKER_IMAGE_TAG)}`,
    `--set environment=${celoEnv}`,
  ]
}
