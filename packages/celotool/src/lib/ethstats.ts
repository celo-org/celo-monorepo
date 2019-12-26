import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { execCmdWithExitOnFailure } from 'src/lib/utils'
import { getBlockscoutUrl } from './endpoints'
import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'
import { AccountType, getAddressesFor } from './generate_utils'

const helmChartPath = '../helm-charts/ethstats'

export async function installHelmChart(celoEnv: string) {
  return installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    helmParameters(celoEnv)
  )
}

export async function removeHelmRelease(celoEnv: string) {
  await removeGenericHelmChart(releaseName(celoEnv))
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

function helmParameters(celoEnv: string) {
  return [
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set ethstats.image.repository=${fetchEnv(envVar.ETHSTATS_DOCKER_IMAGE_REPOSITORY)}`,
    `--set ethstats.image.tag=${fetchEnv(envVar.ETHSTATS_DOCKER_IMAGE_TAG)}`,
    `--set ethstats.trusted_addresses='${String(generateAuthorizedAddresses()).replace(
      /,/g,
      '\\,'
    )}'`,
    `--set ethstats.banned_addresses='${String(fetchEnv(envVar.ETHSTATS_BANNED_ADDRESSES)).replace(
      /,/g,
      '\\,'
    )}'`,
    `--set ethstats.reserved_addresses='${String(
      fetchEnv(envVar.ETHSTATS_RESERVED_ADDRESSES)
    ).replace(/,/g, '\\,')}'`,
    `--set ethstats.network_name='Celo ${celoEnv}'`,
    `--set ethstats.blockscout_url='${getBlockscoutUrl(celoEnv)}'`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-ethstats`
}

function generateAuthorizedAddresses() {
  // TODO: Add the Proxy eth addresses when available
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  const publicKeys = []
  const txNodes = parseInt(fetchEnv(envVar.TX_NODES), 0)
  const validatorNodes = parseInt(fetchEnv(envVar.VALIDATORS), 0)
  publicKeys.push(getAddressesFor(AccountType.TX_NODE, mnemonic, txNodes))
  publicKeys.push(getAddressesFor(AccountType.VALIDATOR, mnemonic, validatorNodes))

  publicKeys.push(fetchEnvOrFallback(envVar.ETHSTATS_TRUSTED_ADDRESSES, '').split(','))
  return publicKeys.reduce((accumulator, value) => accumulator.concat(value), []).filter((_) => !!_)
}
