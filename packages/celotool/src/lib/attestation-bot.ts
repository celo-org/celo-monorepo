import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { execCmdWithExitOnFailure } from 'src/lib/utils'
import { envVar, fetchEnv } from './env-utils'

const helmChartPath = '../helm-charts/attestation-bot'

export async function installHelmChart(celoEnv: string) {
  const params = await helmParameters(celoEnv)
  return installGenericHelmChart(celoEnv, releaseName(celoEnv), helmChartPath, params)
}

export async function upgradeHelmChart(celoEnv: string) {
  console.info(`Upgrading helm release ${releaseName(celoEnv)}`)

  const upgradeCmdArgs = `${releaseName(
    celoEnv
  )} ${helmChartPath} --namespace ${celoEnv} ${helmParameters(celoEnv).join(' ')}`

  if (process.env.CELOTOOL_VERBOSE === 'true') {
    await execCmdWithExitOnFailure(`helm upgrade --debug --dry-run ${upgradeCmdArgs}`)
  }
  await execCmdWithExitOnFailure(`helm upgrade ${upgradeCmdArgs}`)
  console.info(`Helm release ${releaseName(celoEnv)} upgrade successful`)
}

export async function removeHelmRelease(celoEnv: string) {
  return removeGenericHelmChart(releaseName(celoEnv))
}

function helmParameters(celoEnv: string) {
  return [
    `--set imageRepository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set imageTag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set gethImageRepository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set gethImageTag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
    `--set environment=${celoEnv}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set twilio.accountSid="${fetchEnv(envVar.TWILIO_ACCOUNT_SID)}"`,
    `--set twilio.authToken="${fetchEnv(envVar.TWILIO_ACCOUNT_AUTH_TOKEN)}"`,
    `--set networkID=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set geth.verbosity=${fetchEnv('GETH_VERBOSITY')}`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-attestation-bot`
}
