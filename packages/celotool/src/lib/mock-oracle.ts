import { envVar, fetchEnv, isVmBased } from 'src/lib/env-utils'
import { getPrivateTxNodeClusterIP } from 'src/lib/geth'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { getInternalTxNodeLoadBalancerIP } from 'src/lib/vm-testnet-utils'

const helmChartPath = '../helm-charts/mock-oracle'

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
  const nodeIp = isVmBased()
    ? await getInternalTxNodeLoadBalancerIP(celoEnv)
    : await getPrivateTxNodeClusterIP(celoEnv)
  const nodeUrl = `http://${nodeIp}:8545`
  return [
    `--set celotool.image.repository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set celotool.image.tag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set oracle.cronSchedule="${fetchEnv(envVar.MOCK_ORACLE_CRON_SCHEDULE)}"`,
    `--set oracle.image.repository=${fetchEnv(envVar.MOCK_ORACLE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set oracle.image.tag=${fetchEnv(envVar.MOCK_ORACLE_DOCKER_IMAGE_TAG)}`,
    `--set celocli.nodeUrl=${nodeUrl}`,
    `--set celocli.image.repository=${fetchEnv(envVar.CELOCLI_STANDALONE_IMAGE_REPOSITORY)}`,
    `--set celocli.image.tag=${fetchEnv(envVar.CELOCLI_STANDALONE_IMAGE_TAG)}`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-mock-oracle`
}
