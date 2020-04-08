import { getFornoUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'

const helmChartPath = '../helm-charts/oracle'

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

async function helmParameters(celoEnv: string) {
  const replicas = parseInt(fetchEnv(envVar.ORACLES), 10)
  const oraclePrivateKeys = getPrivateKeysFor(
    AccountType.PRICE_ORACLE,
    fetchEnv(envVar.MNEMONIC),
    replicas
  ).map((pkey) => `0x${pkey}`)
  return [
    `--set environmentName=${celoEnv}`,
    `--set replicas=${fetchEnv(envVar.ORACLES)}`,
    `--set image.repository=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set image.tag=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_TAG)}`,
    `--set oracle.web3ProviderUrl=${getFornoUrl(celoEnv)}`,
    `--set oracle.privateKeys={${oraclePrivateKeys.join(',')}}`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-oracle`
}
