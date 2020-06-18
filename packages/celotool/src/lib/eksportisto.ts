import { envVar, fetchEnv, fetchEnvOrFallback, isVmBased } from 'src/lib/env-utils'
import { getInternalTxNodeLoadBalancerIP } from 'src/lib/vm-testnet-utils'
import { execCmdWithExitOnFailure } from './cmd-utils'

export async function installHelmChart(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  console.info(`Installing helm release ${celoEnv}-eksportisto-${suffix}`)
  const params = await helmParameters(celoEnv)
  await execCmdWithExitOnFailure(
    `helm install ../helm-charts/eksportisto/ --name ${celoEnv}-eksportisto-${suffix} ${params.join(
      ' '
    )}
  `
  )
}

export async function upgradeHelmChart(celoEnv: string) {
  console.info(`Upgrading helm release ${celoEnv}-eksportisto`)
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  const params = await helmParameters(celoEnv)
  await execCmdWithExitOnFailure(
    `helm upgrade ${celoEnv}-eksportisto-${suffix} ../helm-charts/eksportisto/ ${params.join(' ')}`
  )
}

export async function removeHelmRelease(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  console.info(`Deleting helm chart ${celoEnv}-eksportisto-${suffix}`)
  await execCmdWithExitOnFailure(`helm del --purge ${celoEnv}-eksportisto-${suffix}`)
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
    `--set sensitiveAccountsBase64=${Buffer.from(fetchSensitiveAccounts()).toString('base64').trim()}`
  ]
  if (isVmBased()) {
    params.push(
      `--set web3Provider="http://${await getInternalTxNodeLoadBalancerIP(celoEnv)}:8545"`
    )
  }
  return params
}
