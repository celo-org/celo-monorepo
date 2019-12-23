import { envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart } from 'src/lib/helm_deploy'

const helmChartPath = '../helm-charts/voting-bot'

export async function installHelmChart(celoEnv: string) {
  const params = await helmParameters(celoEnv)
  return installGenericHelmChart(celoEnv, releaseName(celoEnv), helmChartPath, params)
}

function helmParameters(celoEnv: string) {
  return [
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set environment=${celoEnv}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set votingBotCount=${fetchEnv(envVar.VOTING_BOTS)}`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-voting-bot`
}
