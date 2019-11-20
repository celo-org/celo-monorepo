import { envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart } from 'src/lib/helm_deploy'

const helmChartPath = '../helm-charts/oracle'

export async function installHelmChart(celoEnv: string) {
  return installGenericHelmChart(celoEnv, releaseName(celoEnv), helmChartPath, helmParameters())
}

function helmParameters() {
  return [
    `--set celotool.image.repository=${fetchEnv('CELOTOOL_DOCKER_IMAGE_REPOSITORY')}`,
    `--set celotool.image.tag=${fetchEnv('CELOTOOL_DOCKER_IMAGE_TAG')}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set oracle.image.repository=${fetchEnv('ORACLE_DOCKER_IMAGE_REPOSITORY')}`,
    `--set oracle.image.tag=${fetchEnv('ORACLE_DOCKER_IMAGE_TAG')}`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-oracle`
}
