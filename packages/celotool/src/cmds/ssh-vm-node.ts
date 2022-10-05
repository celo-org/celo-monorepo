import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import { getNodeVmName, getVmSshCommand, indexCoercer } from 'src/lib/vm-testnet-utils'
import yargs from 'yargs'

export const command = 'ssh-vm-node <nodeType> [nodeIndex]'

export const describe =
  'Generates a command to ssh into a vm-testnet node. To execute the ssh command, run `eval $(<this cmd>)`'

interface SshVmNodeArgv extends CeloEnvArgv {
  nodeType: 'validator' | 'tx-node' | 'tx-node-private' | 'bootnode' | 'proxy'
  nodeIndex?: number
}

interface CheckArgs {
  'celo-env': unknown
  nodeType: string | undefined
  nodeIndex?: string
}

export const builder = (argv: yargs.Argv) => {
  const choices: readonly string[] = [
    'validator',
    'tx-node',
    'tx-node-private',
    'bootnode',
    'proxy',
  ]
  return addCeloEnvMiddleware(argv)
    .positional('nodeType', {
      describe: 'Type of node',
      choices,
    })
    .positional('nodeIndex', {
      describe: 'Index of the node. Only needed for validator or tx-node',
      type: 'string',
      coerce: indexCoercer,
    })
    .check((checkArgv: CheckArgs) => {
      const requiresIndex = checkArgv.nodeType !== 'bootnode'
      if (requiresIndex && checkArgv.nodeIndex === undefined) {
        return new Error(`nodeIndex is required for nodeType ${checkArgv.nodeType}`)
      }
      return true
    })
}

export const handler = async (argv: SshVmNodeArgv) => {
  const instanceName = await getNodeVmName(argv.celoEnv, argv.nodeType, argv.nodeIndex)
  console.info(getVmSshCommand(instanceName))
}
