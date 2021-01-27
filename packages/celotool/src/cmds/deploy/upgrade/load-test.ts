import sleep from 'sleep-promise'
import {
  builder as initialBuilder,
  LoadTestArgv,
  setArgvDefaults,
} from 'src/cmds/deploy/initial/load-test'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { scaleResource } from 'src/lib/kubernetes'
import { upgradeHelmChart } from 'src/lib/load-test'
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
  await switchToClusterFromEnv()
  setArgvDefaults(argv)

  if (argv.reset === true) {
    await resetAndUpgrade(argv)
  } else {
    await upgrade(argv)
  }
}

function upgrade(argv: LoadTestUpgradeArgv) {
  return upgradeHelmChart(argv.celoEnv, argv.blockscoutMeasurePercent, argv.delay, argv.replicas)
}

// scales down all pods, upgrades, then scales back up
async function resetAndUpgrade(argv: LoadTestUpgradeArgv) {
  const loadTestStatefulSetName = `${argv.celoEnv}-load-test`

  console.info('Scaling load-test StatefulSet down to 0...')
  await scaleResource(argv.celoEnv, 'StatefulSet', loadTestStatefulSetName, 0)

  await sleep(3000)

  await upgrade(argv)

  await sleep(3000)

  console.info(`Scaling load-test StatefulSet back up to ${argv.replicas}...`)
  await scaleResource(argv.celoEnv, 'StatefulSet', loadTestStatefulSetName, argv.replicas)
}
