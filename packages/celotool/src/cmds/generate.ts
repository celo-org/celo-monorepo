import * as yargs from 'yargs'

export const command = 'generate <command>'
export const describe = 'commands for generating network parameters'

export const builder = (argv: yargs.Argv) => argv.commandDir('generate', { extensions: ['ts'] })

export const handler = () => {
  // empty
}
