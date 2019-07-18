import { UpgradeArgv } from '@celo/celotool/src/cmds/deploy/upgrade'
import { installHelmChart } from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { retrieveCloudSQLConnectionInfo, upgradeHelmChart } from 'src/lib/helm_deploy'
import { fetchEnvOrFallback } from 'src/lib/utils'

export const command = 'blockscout'
export const describe = 'migrate an existing deploy to the blockscout package'

// Can't extend because yargs.Argv already has a `reset` property
type TestnetArgv = UpgradeArgv & {
  reset: boolean
}

export const builder = {}

export const handler = async (argv: TestnetArgv) => {
  await switchToClusterFromEnv()

  const instanceName = `${argv.celoEnv}${fetchEnvOrFallback('BLOCKSCOUT_DB_SUFFIX', '')}`

  const [
    blockscoutDBUsername,
    blockscoutDBPassword,
    blockscoutDBConnectionName,
  ] = await retrieveCloudSQLConnectionInfo(argv.celoEnv, instanceName)

  await upgradeHelmChart(argv.celoEnv)

  // Install the blockscout package
  await installHelmChart(
    argv.celoEnv,
    blockscoutDBUsername,
    blockscoutDBPassword,
    blockscoutDBConnectionName
  )
}
