import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { getEnodesAddresses } from 'src/lib/geth'
import { envVar, fetchEnv } from './env-utils'

export async function installHelmChart(celoEnv: string) {
  console.info(`Installing helm release ${celoEnv}-tracer-tool`)

  const params = await helmParameters(celoEnv)

  await execCmdWithExitOnFailure(
    `helm install ../helm-charts/tracer-tool/ --name ${celoEnv}-tracer-tool ${params}`
  )
}

export async function upgradeHelmChart(celoEnv: string) {
  console.info(`Upgrading helm release ${celoEnv}-tracer-tool`)

  const params = await helmParameters(celoEnv)

  await execCmdWithExitOnFailure(
    `helm upgrade ${celoEnv}--tracer-tool ../helm-charts/tracer-tool/ ${params}`
  )
}

export async function removeHelmRelease(celoEnv: string) {
  console.info(`Deleting helm chart ${celoEnv}-tracer-tool`)
  await execCmdWithExitOnFailure(`helm del --purge ${celoEnv}-tracer-tool`)
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
  ].join(' ')
}
