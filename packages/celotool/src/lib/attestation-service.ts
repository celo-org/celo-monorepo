import { getEnodesWithExternalIPAddresses } from 'src/lib/geth'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  setHelmArray,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'
import { getGenesisBlockFromGoogleStorage } from 'src/lib/testnet-utils'
import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'

const helmChartPath = '../helm-charts/attestation-service'

export async function installHelmChart(celoEnv: string) {
  await installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv)
  )
}

export async function removeHelmRelease(celoEnv: string) {
  await removeGenericHelmChart(releaseName(celoEnv), celoEnv)
}

export async function upgradeHelmChart(celoEnv: string) {
  await upgradeGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv)
  )
}

async function helmParameters(celoEnv: string) {
  const enodes = await getEnodesWithExternalIPAddresses(celoEnv)
  const staticNodesJsonB64 = Buffer.from(JSON.stringify(enodes)).toString('base64')
  const genesisContents = await getGenesisBlockFromGoogleStorage(celoEnv)
  const genesisFileJsonB64 = Buffer.from(genesisContents).toString('base64')
  return [
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set celotool.image.repository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set celotool.image.tag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set attestation_service.image.repository=${fetchEnv(
      envVar.ATTESTATION_SERVICE_DOCKER_IMAGE_REPOSITORY
    )}`,
    `--set attestation_service.image.tag=${fetchEnv(envVar.ATTESTATION_SERVICE_DOCKER_IMAGE_TAG)}`,
    `--set attestation_service.twilio.accountSid="${fetchEnv(envVar.TWILIO_ACCOUNT_SID)}"`,
    `--set attestation_service.twilio.authToken="${fetchEnv(envVar.TWILIO_ACCOUNT_AUTH_TOKEN)}"`,
    `--set attestation_service.twilio.addressSid="${fetchEnv(envVar.TWILIO_ADDRESS_SID)}"`,
    `--set attestation_service.nexmo.apiKey="${fetchEnv(envVar.NEXMO_KEY)}"`,
    `--set attestation_service.nexmo.apiSecret="${fetchEnv(envVar.NEXMO_SECRET)}"`,
    `--set attestation_service.telekom.apiKey="${fetchEnv(envVar.TELEKOM_API_KEY)}"`,
    `--set attestation_service.telekom.from="${fetchEnv(envVar.TELEKOM_FROM)}"`,
    `--set attestation_service.sms_providers="${fetchEnv(envVar.SMS_PROVIDERS)
      .split(',')
      .join('\\,')}"`,
    `--set attestation_service.sms_providers_randomized="${fetchEnv(
      envVar.SMS_PROVIDERS_RANDOMIZED
    )}"`,
    ...setHelmArray(
      'attestation_service.nexmo.applications',
      fetchEnvOrFallback(envVar.NEXMO_APPLICATIONS, '').split(',')
    ),
    `--set geth.validators="${fetchEnv(envVar.VALIDATORS)}"`,
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set global.postgresql.postgresqlDatabase=AttestationService`,
    // TODO(nambrot): Hardcode for now, couldn't figure out how to make it work dynamically
    // DB is exposed as ClusterIP service only
    `--set global.postgresql.postgresqlPassword=password`,
    `--set geth.genesisFile=${genesisFileJsonB64}`,
    `--set geth.staticNodes="${staticNodesJsonB64}"`,
    `--set geth.genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set genesis.epoch_size=${fetchEnv(envVar.EPOCH)}`,
    `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set geth.verbosity=${fetchEnvOrFallback(envVar.GETH_VERBOSITY, '3')}`,
    `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-attestation-service`
}
