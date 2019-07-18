import { GethArgv } from '@celo/celotool/src/cmds/geth'
import { execCmdWithExitOnFailure } from '@celo/celotool/src/lib/utils'
import * as yargs from 'yargs'

export const command = 'build'

export const describe = 'command for building geth'

interface BuildArgv extends GethArgv {
  clean: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('geth-dir', {
      type: 'string',
      description: 'path to geth repository',
      demand: 'Please, specify the path to geth directory, where the binary could be found',
    })
    .option('clean', {
      type: 'boolean',
      alias: 'c',
      description: 'whether to clean before make',
      default: false,
    })
}

export const handler = async (argv: BuildArgv) => {
  const cmd = argv.clean ? `make clean && make -j` : `make -j`
  await execCmdWithExitOnFailure(cmd, { cwd: argv.gethDir })

  console.info(`Geth has been built successfully!`)
}
