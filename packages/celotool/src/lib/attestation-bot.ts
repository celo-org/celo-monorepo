import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
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
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set imageRepository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set imageTag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set gethImageRepository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set gethImageTag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
    `--set environment=${celoEnv}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set twilio.accountSid="${fetchEnv(envVar.TWILIO_ACCOUNT_SID)}"`,
    `--set twilio.authToken="${fetchEnv(envVar.TWILIO_ACCOUNT_AUTH_TOKEN)}"`,
    `--set twilio.addressSid="${fetchEnv(envVar.TWILIO_ADDRESS_SID)}"`,
    `--set initialWaitSeconds=${fetchEnv(envVar.ATTESTATION_BOT_INITIAL_WAIT_SECONDS)}`,
    `--set inBetweenWaitSeconds=${fetchEnv(envVar.ATTESTATION_BOT_IN_BETWEEN_WAIT_SECONDS)}`,
    `--set maxAttestations=${fetchEnv(envVar.ATTESTATION_BOT_MAX_ATTESTATIONS)}`,
    `--set networkID=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set geth.verbosity=${fetchEnv('GETH_VERBOSITY')}`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-attestation-bot`
}
