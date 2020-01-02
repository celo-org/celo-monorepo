import { envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'

const helmChartPath = '../helm-charts/voting-bot'

export async function installHelmChart(cteloEnv: string) {
  const params = await helmParameters(celoEnv)
  return installGenericHelmChart(celoEnv, releaseName(celoEnv), helmChartPath, params)
}
export async function removeHelmRelease(celoEnv: string) {
  await removeGenericHelmChart(releaseName(celoEnv))
}

function helmParameters(celoEnv: string) {
  return [
    `--set cronSchedule="${fetchEnv(envVar.VOTING_BOT_CRON_SCHEDULE)}"`,
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set environment=${celoEnv}`,
    `--set imageRepository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set imageTag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set votingBotCount=${fetchEnv(envVar.VOTING_BOTS)}`,
    `--set voteChangeProbability="${fetchEnv(envVar.VOTING_BOT_CHANGE_PROBABILITY)}"`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-voting-bot`
}
