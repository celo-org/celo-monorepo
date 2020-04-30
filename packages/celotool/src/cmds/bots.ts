import yargs from 'yargs'

export const command = 'bots <command>'

export const describe = 'various bots we have'

export type BotsArgv = yargs.Argv

export const builder = (argv: yargs.Argv) => {
  return argv.commandDir('bots', { extensions: ['ts'] })
}

export const handler = () => {
  // empty
}
