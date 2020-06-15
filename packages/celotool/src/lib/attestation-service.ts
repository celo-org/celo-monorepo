import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { getEnodesWithExternalIPAddresses } from 'src/lib/geth'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { getGenesisBlockFromGoogleStorage } from 'src/lib/testnet-utils'
import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'

const helmChartPath = '../helm-charts/attestation-service'

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

  const upgradeCmdArgs = `${releaseName(celoEnv)} ${helmChartPath} --namespace ${celoEnv} ${(
    await helmParameters(celoEnv)
  ).join(' ')}`

  if (process.env.CELOTOOL_VERBOSE === 'true') {
    await execCmdWithExitOnFailure(`helm upgrade --debug --dry-run ${upgradeCmdArgs}`)
  }
  await execCmdWithExitOnFailure(`helm upgrade ${upgradeCmdArgs}`)
  console.info(`Helm release ${releaseName(celoEnv)} upgrade successful`)
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
    `--set attestation_service.nexmo.apiKey="${fetchEnv(envVar.NEXMO_KEY)}"`,
    `--set attestation_service.nexmo.apiSecret="${fetchEnv(envVar.NEXMO_SECRET)}"`,
    `--set geth.validators="${fetchEnv(envVar.VALIDATORS)}"`,
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set global.postgresql.postgresqlDatabase=AttestationService`,
    // TODO(nambrot): Hardcode for now, couldn't figure out how to make it work dynamically
    // DB is exposed as ClusterIP service only
    `--set global.postgresql.postgresqlPassword=password`,
    `--set geth.genesisFile=${genesisFileJsonB64}`,
    `--set geth.staticNodes="${staticNodesJsonB64}"`,
    `--set geth.genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set geth.verbosity=${fetchEnvOrFallback(envVar.GETH_VERBOSITY, '3')}`,
    `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-attestation-service`
}
