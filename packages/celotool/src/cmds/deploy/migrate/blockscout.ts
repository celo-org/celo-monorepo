import { getReleaseName, installHelmChart } from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { envVar, fetchEnv, fetchEnvOrFallback } from 'src/lib/env-utils'
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
  const helmReleaseName = getReleaseName(argv.celoEnv, dbSuffix)

  // Install the blockscout package
  await installHelmChart(argv.celoEnv, helmReleaseName, imageTag)
}
