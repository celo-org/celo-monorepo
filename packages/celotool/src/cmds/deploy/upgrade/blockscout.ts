import { UpgradeArgv } from '@celo/celotool/src/cmds/deploy/upgrade'
import sleep from 'sleep-promise'
import { installHelmChart, removeHelmRelease, upgradeHelmChart } from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { resetCloudSQLInstance, retrieveCloudSQLConnectionInfo } from 'src/lib/helm_deploy'
import { execCmdWithExitOnFailure, fetchEnvOrFallback } from 'src/lib/utils'
import * as yargs from 'yargs'

export const command = 'blockscout'
export const describe = 'upgrade an existing deploy of the blockscout package'

// Can't extend because yargs.Argv already has a `reset` property
type TestnetArgv = UpgradeArgv & {
  reset: boolean
}

export const builder: { [key: string]: yargs.Options } = {
  reset: {
    description:
      'when enabled, deletes the database and redeploys the helm chart. keeps the instance.',
    default: false,
    type: 'boolean',
  },
}

export const handler = async (argv: TestnetArgv) => {
  await switchToClusterFromEnv()

  const instanceName = `${argv.celoEnv}${fetchEnvOrFallback('BLOCKSCOUT_DB_SUFFIX', '')}`

  const [
    blockscoutDBUsername,
    blockscoutDBPassword,
    blockscoutDBConnectionName,
  ] = await retrieveCloudSQLConnectionInfo(argv.celoEnv, instanceName)

  if (argv.reset) {
    console.info(
      'Running upgrade with --reset flag which will reset the database and reinstall the helm chart'
    )

    await removeHelmRelease(argv.celoEnv)

    console.info('Sleep for 30 seconds to have all connections killed')
    await sleep(30000)

    await resetCloudSQLInstance(instanceName)

    await installHelmChart(
      argv.celoEnv,
      blockscoutDBUsername,
      blockscoutDBPassword,
      blockscoutDBConnectionName
    )
  } else {
    console.info(`Delete blockscout-migration`)
    try {
      await execCmdWithExitOnFailure(
        `kubectl delete job ${argv.celoEnv}-blockscout-migration -n ${argv.celoEnv}`
      )
    } catch (error) {
      console.error(error)
    }

    await upgradeHelmChart(
      argv.celoEnv,
      blockscoutDBUsername,
      blockscoutDBPassword,
      blockscoutDBConnectionName
    )
  }
}
