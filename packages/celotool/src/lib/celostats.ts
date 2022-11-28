import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'
import { getBlockscoutUrl, getFornoUrl } from './endpoints'
import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'
import { AccountType, getAddressesFor } from './generate_utils'

const helmChartPath = '../helm-charts/celostats'

export async function installHelmChart(celoEnv: string) {
  return installGenericHelmChart({
    namespace: celoEnv,
    releaseName: releaseName(celoEnv),
    chartDir: helmChartPath,
    parameters: helmParameters(celoEnv),
  })
}

export async function removeHelmRelease(celoEnv: string) {
  await removeGenericHelmChart(releaseName(celoEnv), celoEnv)
}

export async function upgradeHelmChart(celoEnv: string) {
  await upgradeGenericHelmChart({
    namespace: celoEnv,
    releaseName: releaseName(celoEnv),
    chartDir: helmChartPath,
    parameters: helmParameters(celoEnv),
  })
}

function helmParameters(celoEnv: string) {
  return [
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set celostats.image.server.repository=${fetchEnv(
      envVar.CELOSTATS_SERVER_DOCKER_IMAGE_REPOSITORY
    )}`,
    `--set celostats.image.server.tag=${fetchEnv(envVar.CELOSTATS_SERVER_DOCKER_IMAGE_TAG)}`,
    `--set celostats.image.frontend.repository=${fetchEnv(
      envVar.CELOSTATS_FRONTEND_DOCKER_IMAGE_REPOSITORY
    )}`,
    `--set celostats.image.frontend.tag=${fetchEnv(envVar.CELOSTATS_FRONTEND_DOCKER_IMAGE_TAG)}`,
    `--set celostats.trusted_addresses='${String(generateAuthorizedAddresses()).replace(
      /,/g,
      '\\,'
    )}'`,
    `--set celostats.banned_addresses='${String(
      fetchEnv(envVar.CELOSTATS_BANNED_ADDRESSES)
    ).replace(/,/g, '\\,')}'`,
    `--set celostats.reserved_addresses='${String(
      fetchEnv(envVar.CELOSTATS_RESERVED_ADDRESSES)
    ).replace(/,/g, '\\,')}'`,
    `--set celostats.network_name='Celo ${celoEnv}'`,
    `--set celostats.blockscout_url='${getBlockscoutUrl(celoEnv)}'`,
    `--set celostats.jsonrpc='${getFornoUrl(celoEnv)}'`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-celostats`
}

function generateAuthorizedAddresses() {
  // TODO: Add the Proxy eth addresses when available
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  const publicKeys = []
  const txNodes = parseInt(fetchEnv(envVar.TX_NODES), 0)
  const validatorNodes = parseInt(fetchEnv(envVar.VALIDATORS), 0)
  publicKeys.push(getAddressesFor(AccountType.TX_NODE, mnemonic, txNodes))
  publicKeys.push(getAddressesFor(AccountType.VALIDATOR, mnemonic, validatorNodes))

  publicKeys.push(fetchEnvOrFallback(envVar.CELOSTATS_TRUSTED_ADDRESSES, '').split(','))
  return publicKeys.reduce((accumulator, value) => accumulator.concat(value), []).filter((_) => !!_)
}
