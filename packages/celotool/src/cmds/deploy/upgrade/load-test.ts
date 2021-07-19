import { builder as initialBuilder, LoadTestArgv } from 'src/cmds/deploy/initial/load-test'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { isCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { resetAndUpgrade, setArgvDefaults, upgradeHelmChart } from 'src/lib/load-test'
import yargs from 'yargs'

export const command = 'load-test'

export const describe = 'deploy load-test'

type LoadTestUpgradeArgv = LoadTestArgv & {
  reset: boolean
}

export const builder = (argv: yargs.Argv) => {
  initialBuilder(argv).option('reset', {
    description: 'Scale down all load-test clients, upgrade, and scale back up',
    default: false,
    type: 'boolean',
  })
}

export const handler = async (argv: LoadTestUpgradeArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)
  setArgvDefaults(argv)

  if (argv.reset === true && !isCelotoolHelmDryRun()) {
    await resetAndUpgrade(
      argv.celoEnv,
      argv.blockscoutMeasurePercent,
      argv.delay,
      argv.replicas,
      argv.threads
    )
  } else {
    await upgradeHelmChart(
      argv.celoEnv,
      argv.blockscoutMeasurePercent,
      argv.delay,
      argv.replicas,
      argv.threads
    )
  }
}
