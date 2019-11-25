import { envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart } from 'src/lib/helm_deploy'

const helmChartPath = '../helm-charts/oracle'

export async function installHelmChart(celoEnv: string) {
  return installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    helmParameters(celoEnv)
  )
}

function helmParameters(_celoEnv: string) {
  return [
    `--set celotool.image.repository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set celotool.image.tag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set oracle.image.repository=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set oracle.image.tag=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_TAG)}`,
    // `--set celocli.nodeUrl=${getFornoUrl(celoEnv)}`,
    `--set celocli.nodeUrl='http://34.83.46.9:8545'`,
    `--set celocli.image.repository=${fetchEnv(envVar.CELOCLI_STANDALONE_IMAGE_REPOSITORY)}`,
    `--set celocli.image.tag=${fetchEnv(envVar.CELOCLI_STANDALONE_IMAGE_TAG)}`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-oracle`
}
