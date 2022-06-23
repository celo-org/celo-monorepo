import { DestroyArgv } from 'src/cmds/deploy/destroy'
import { getInstanceName, getReleaseName, removeHelmRelease } from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { envVar, fetchEnvOrFallback } from 'src/lib/env-utils'
import { deleteCloudSQLInstance, exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { outputIncludes } from 'src/lib/utils'
import yargs from 'yargs'

export const command = 'blockscout'
export const describe = 'upgrade an existing deploy of the blockscout package'

export const builder = (argv: yargs.Argv) => {
  return argv.option('suffix', {
    type: 'string',
    description: 'Instance suffix',
    default: '',
  })
}

type BlockscoutDestroyArgv = DestroyArgv & {
  suffix: string
}

export const handler = async (argv: BlockscoutDestroyArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnv(argv.celoEnv)

  const dbSuffix = argv.suffix || fetchEnvOrFallback(envVar.BLOCKSCOUT_DB_SUFFIX, '')
  const instanceName = getInstanceName(argv.celoEnv, dbSuffix)
  const helmReleaseName = getReleaseName(argv.celoEnv, dbSuffix)

  // Delete replica before deleting the master
  await deleteCloudSQLInstance(instanceName + '-replica')
  await deleteCloudSQLInstance(instanceName)
  await removeHelmRelease(helmReleaseName, argv.celoEnv)
  await cleanDefaultIngress(argv.celoEnv, `${argv.celoEnv}-blockscout-web-ingress`)
}

async function cleanDefaultIngress(celoEnv: string, ingressName: string) {
  const otherRelease = await outputIncludes(
    `helm list -A`,
    `${celoEnv}-blockscout`,
    `other blockscout instance exists, skipping removing common ingress: ${ingressName}`
  )
  if (!otherRelease) {
    console.info(`Removing ingress ${ingressName}`)
    await execCmdWithExitOnFailure(`kubectl delete ingress --namespace=${celoEnv} ${ingressName}`)
  }
}
