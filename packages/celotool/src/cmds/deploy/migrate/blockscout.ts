import { getInstanceName, getReleaseName, installHelmChart } from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { envVar, fetchEnv, fetchEnvOrFallback } from 'src/lib/env-utils'
import { retrieveCloudSQLConnectionInfo } from 'src/lib/helm_deploy'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'blockscout'
export const describe = 'migrate an existing deploy to the blockscout package'

// Can't extend because yargs.Argv already has a `reset` property
type TestnetArgv = UpgradeArgv & {
  reset: boolean
}

export const builder = {}

export const handler = async (argv: TestnetArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)

  const dbSuffix = fetchEnvOrFallback(envVar.BLOCKSCOUT_DB_SUFFIX, '')
  const imageTag = fetchEnv(envVar.BLOCKSCOUT_DOCKER_IMAGE_TAG)
  const instanceName = getInstanceName(argv.celoEnv, dbSuffix)
  const helmReleaseName = getReleaseName(argv.celoEnv, dbSuffix)

  const [
    blockscoutDBUsername,
    blockscoutDBPassword,
    blockscoutDBConnectionName,
  ] = await retrieveCloudSQLConnectionInfo(argv.celoEnv, instanceName, dbSuffix)

  // Install the blockscout package
  await installHelmChart(
    argv.celoEnv,
    helmReleaseName,
    imageTag,
    blockscoutDBUsername,
    blockscoutDBPassword,
    blockscoutDBConnectionName
  )
}
