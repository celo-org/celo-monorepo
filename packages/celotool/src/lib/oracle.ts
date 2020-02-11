import { getFornoUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv, isVmBased } from 'src/lib/env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { getInternalTxNodeLoadBalancerIP } from 'src/lib/vm-testnet-utils'

const helmChartPath = '../helm-charts/oracle'

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

async function helmParameters(celoEnv: string) {
  let nodeUrl
  if (isVmBased()) {
    nodeUrl = `http://${await getInternalTxNodeLoadBalancerIP(celoEnv)}:8545`
  } else {
    nodeUrl = getFornoUrl(celoEnv)
  }
  return [
    `--set celotool.image.repository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set celotool.image.tag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set oracle.cronSchedule="${fetchEnv(envVar.ORACLE_CRON_SCHEDULE)}"`,
    `--set oracle.image.repository=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set oracle.image.tag=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_TAG)}`,
    `--set celocli.nodeUrl=${nodeUrl}`,
    `--set celocli.image.repository=${fetchEnv(envVar.CELOCLI_STANDALONE_IMAGE_REPOSITORY)}`,
    `--set celocli.image.tag=${fetchEnv(envVar.CELOCLI_STANDALONE_IMAGE_TAG)}`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-oracle`
}
