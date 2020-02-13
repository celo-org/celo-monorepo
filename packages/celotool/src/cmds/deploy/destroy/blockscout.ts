import { DestroyArgv } from 'src/cmds/deploy/destroy'
import { removeHelmRelease } from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { fetchEnvOrFallback } from 'src/lib/env-utils'
import { deleteCloudSQLInstance } from 'src/lib/helm_deploy'
import { execCmdWithExitOnFailure, outputIncludes } from 'src/lib/utils'

export const command = 'blockscout'
export const describe = 'upgrade an existing deploy of the blockscout package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await switchToClusterFromEnv()

  const instanceName = `${argv.celoEnv}${fetchEnvOrFallback('BLOCKSCOUT_DB_SUFFIX', '')}`
  const helmReleaseName = `${argv.celoEnv}-blockscout${fetchEnvOrFallback(
    'BLOCKSCOUT_DB_SUFFIX',
    ''
  )}`

  // Delete replica before deleting the master
  await deleteCloudSQLInstance(instanceName + '-replica')
  await deleteCloudSQLInstance(instanceName)
  await removeHelmRelease(helmReleaseName)
  await cleanDefaultIngress(argv.celoEnv, `${argv.celoEnv}-blockscout-web-ingress`)
}

async function cleanDefaultIngress(celoEnv: string, ingressName: string) {
  const otherRelease = await outputIncludes(
    `helm list`,
    `${celoEnv}-blockscout`,
    `other blockscout instance exists, skipping removing common ingress: ${ingressName}`
  )
  if (!otherRelease) {
    console.info(`Removing ingress ${ingressName}`)
    await execCmdWithExitOnFailure(`kubectl delete ingress --namespace=${celoEnv} ${ingressName}`)
  }
}
