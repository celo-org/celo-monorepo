import { getEnodesAddresses } from 'src/lib/geth'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'
import { envVar, fetchEnv } from './env-utils'

const chartDir = '../helm-charts/tracer-tool/'

function releaseName(celoEnv: string) {
  return `${celoEnv}-tracer-tool`
}

export async function installHelmChart(celoEnv: string) {
  await installGenericHelmChart({
    namespace: celoEnv,
    releaseName: releaseName(celoEnv),
    chartDir,
    parameters: await helmParameters(celoEnv),
  })
}

export async function upgradeHelmChart(celoEnv: string) {
  await upgradeGenericHelmChart({
    namespace: celoEnv,
    releaseName: releaseName(celoEnv),
    chartDir,
    parameters: await helmParameters(celoEnv),
  })
}

export async function removeHelmRelease(celoEnv: string) {
  await removeGenericHelmChart(releaseName(celoEnv), celoEnv)
}

async function helmParameters(celoEnv: string) {
  const enodes = await getEnodesAddresses(celoEnv)
  const b64EnodesJSON = Buffer.from(JSON.stringify(enodes, null, 0)).toString('base64')

  return [
    `--namespace ${celoEnv}`,
    `--set imageRepository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set imageTag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set environment=${celoEnv}`,
    `--set enodes="${b64EnodesJSON}"`,
  ]
}
