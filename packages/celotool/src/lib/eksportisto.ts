import { envVar, fetchEnv, fetchEnvOrFallback, isVmBased } from 'src/lib/env-utils'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'
import { getInternalTxNodeLoadBalancerIP } from 'src/lib/vm-testnet-utils'

const chartDir = '../helm-charts/eksportisto/'

function releaseName(celoEnv: string, suffix: string) {
  return `${celoEnv}-eksportisto-${suffix}`
}

export async function installHelmChart(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  await installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv, suffix),
    chartDir,
    await helmParameters(celoEnv)
  )
}

export async function upgradeHelmChart(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  await upgradeGenericHelmChart(
    celoEnv,
    releaseName(celoEnv, suffix),
    chartDir,
    await helmParameters(celoEnv)
  )
}

export async function removeHelmRelease(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  await removeGenericHelmChart(releaseName(celoEnv, suffix), celoEnv)
}

function fetchSensitiveAccounts() {
  return JSON.stringify({})
}

async function helmParameters(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  const params = [
    `--namespace ${celoEnv}`,
    `--set environment="${celoEnv}"`,
    `--set imageRepository="${fetchEnv(envVar.EKSPORTISTO_DOCKER_IMAGE_REPOSITORY)}"`,
    `--set imageTag="${fetchEnv(envVar.EKSPORTISTO_DOCKER_IMAGE_TAG)}"`,
    `--set deploymentSuffix=${suffix}`,
    `--set sensitiveAccountsBase64=${Buffer.from(fetchSensitiveAccounts())
      .toString('base64')
      .trim()}`,
  ]
  if (isVmBased()) {
    params.push(`--set web3Provider="ws://${await getInternalTxNodeLoadBalancerIP(celoEnv)}:8546"`)
  } else {
    params.push(`--set web3Provider="ws://tx-nodes:8546"`)
  }
  return params
}
