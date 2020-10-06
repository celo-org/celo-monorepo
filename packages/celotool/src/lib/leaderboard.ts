import { execCmd, execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
const yaml = require('js-yaml')
const helmChartPath = '../helm-charts/leaderboard'

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

export async function upgradeHelmChart(celoEnv: string) {
  console.info(`Upgrading helm release ${releaseName(celoEnv)}`)

  const params = (await helmParameters(celoEnv)).join(' ')

  const upgradeCmdArgs = `${releaseName(celoEnv)} ${helmChartPath} --namespace ${celoEnv} ${params}`

  if (process.env.CELOTOOL_VERBOSE === 'true') {
    await execCmdWithExitOnFailure(`helm upgrade --debug --dry-run ${upgradeCmdArgs}`)
  }
  await execCmdWithExitOnFailure(`helm upgrade ${upgradeCmdArgs}`)
  console.info(`Helm release ${releaseName(celoEnv)} upgrade successful`)
}

export async function helmParameters(celoEnv: string) {
  const dbValues = await getBlockscoutHelmValues(celoEnv)
  return [
    `--set leaderboard.db.connection_name=${dbValues.connection_name}`,
    `--set leaderboard.db.username=${dbValues.username}`,
    `--set leaderboard.db.password=${dbValues.password}`,
    `--set leaderboard.image.repository=${fetchEnv(envVar.LEADERBOARD_DOCKER_IMAGE_REPOSITORY)}`,
    `--set leaderboard.image.tag=${fetchEnv(envVar.LEADERBOARD_DOCKER_IMAGE_TAG)}`,
    `--set leaderboard.sheet=${fetchEnv(envVar.LEADERBOARD_SHEET)}`,
    `--set leaderboard.token=${fetchEnv(envVar.LEADERBOARD_TOKEN)}`,
    `--set leaderboard.credentials=${fetchEnv(envVar.LEADERBOARD_CREDENTIALS)}`,
    `--set leaderboard.web3=https://${celoEnv}-forno.${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}.org`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-leaderboard`
}

export async function getBlockscoutHelmValues(celoEnv: string) {
  const [output] = await execCmd(`helm get values ${celoEnv}-blockscout`)
  const blockscoutValues: any = yaml.safeLoad(output)
  return blockscoutValues.blockscout.db
}
