/* tslint:disable no-console */
import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import { getBootnodeEnode } from 'src/lib/geth'
import yargs from 'yargs'

export const command = 'bootnode-enode'

export const describe = 'command for the bootnode enode address for an environment'

export const builder = (argv: yargs.Argv) => addCeloEnvMiddleware(argv)

export const handler = async (argv: CeloEnvArgv) => {
  console.info(await getBootnodeEnode(argv.celoEnv))
}
