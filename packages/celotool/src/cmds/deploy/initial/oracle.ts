import { InitialArgv } from 'src/cmds/deploy/initial'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { CurrencyPair } from 'src/lib/k8s-oracle/base'
import { getOracleDeployerForContext } from 'src/lib/oracle'
import yargs from 'yargs'

export const command = 'oracle'

export const describe = 'deploy the oracle for the specified network'

type OracleInitialArgv = InitialArgv &
  ContextArgv & {
    useForno: boolean
    currencyPair: CurrencyPair
  }

export const builder = (argv: yargs.Argv) => {
  return addContextMiddleware(argv)
    .option('useForno', {
      description: 'Uses forno for RPCs from the oracle clients',
      default: false,
      type: 'boolean',
    })
    .option('currencyPair', {
      choices: ['CELOUSD', 'CELOEUR', 'CELOBTC'],
      description: 'Oracle deployment to target based on currency pair',
      type: 'string',
    })
}

export const handler = async (argv: OracleInitialArgv) => {
  const clusterManager = await switchToContextCluster(argv.celoEnv, argv.context)
  const deployer = getOracleDeployerForContext(
    argv.celoEnv,
    argv.context,
    argv.currencyPair,
    argv.useForno,
    clusterManager
  )
  await deployer.installChart()
}
