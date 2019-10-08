import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { execCmdWithExitOnFailure } from 'src/lib/utils'
import { envVar, fetchEnv } from './env-utils'

const helmChartPath = '../helm-charts/attestation-service'

export async function installHelmChart(celoEnv: string) {
  return installGenericHelmChart(celoEnv, releaseName(celoEnv), helmChartPath, helmParameters())
}

export async function removeHelmRelease(celoEnv: string) {
  await removeGenericHelmChart(releaseName(celoEnv))
}

export async function upgradeHelmChart(celoEnv: string) {
  console.info(`Upgrading helm release ${releaseName(celoEnv)}`)

  const upgradeCmdArgs = `${releaseName(
    celoEnv
  )} ${helmChartPath} --namespace ${celoEnv} ${helmParameters().join(' ')}`

  if (process.env.CELOTOOL_VERBOSE === 'true') {
    await execCmdWithExitOnFailure(`helm upgrade --debug --dry-run ${upgradeCmdArgs}`)
  }
  await execCmdWithExitOnFailure(`helm upgrade ${upgradeCmdArgs}`)
  console.info(`Helm release ${releaseName(celoEnv)} upgrade successful`)
}

function helmParameters() {
  return [
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set celotool.image.repository=${fetchEnv('CELOTOOL_DOCKER_IMAGE_REPOSITORY')}`,
    `--set celotool.image.tag=${fetchEnv('CELOTOOL_DOCKER_IMAGE_TAG')}`,
    `--set attestation_service.image.repository=${fetchEnv(
      envVar.ATTESTATION_SERVICE_DOCKER_IMAGE_REPOSITORY
    )}`,
    `--set attestation_service.image.tag=${fetchEnv(envVar.ATTESTATION_SERVICE_DOCKER_IMAGE_TAG)}`,
    `--set attestation_service.image.tag=${fetchEnv(envVar.ATTESTATION_SERVICE_DOCKER_IMAGE_TAG)}`,
    `--set attestation_service.nexmo.apiKey="${fetchEnv(envVar.NEXMO_KEY)}"`,
    `--set attestation_service.nexmo.apiSecret="${fetchEnv(envVar.NEXMO_SECRET)}"`,
    `--set attestation_service.sms_retriever_hash_code="${fetchEnv(
      envVar.SMS_RETRIEVER_HASH_CODE
    )}"`,
    `--set geth.validators="${fetchEnv(envVar.VALIDATORS)}"`,
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-attestation-service`
}
