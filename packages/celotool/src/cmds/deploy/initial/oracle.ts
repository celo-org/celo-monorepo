import { flow } from 'lodash'
import { InitialArgv } from 'src/cmds/deploy/initial'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { CurrencyPair } from 'src/lib/k8s-oracle/base'
import {
  addCurrencyPairMiddleware,
  addUseFornoMiddleware,
  getOracleDeployerForContext,
} from 'src/lib/oracle'
import yargs from 'yargs'

export const command = 'oracle'

export const describe = 'deploy the oracle for the specified network'

type OracleInitialArgv = InitialArgv &
  ContextArgv & {
    useForno: boolean
    currencyPair: CurrencyPair
  }

export const builder = (argv: yargs.Argv) => {
  return flow([addContextMiddleware, addCurrencyPairMiddleware, addUseFornoMiddleware])(argv)
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
