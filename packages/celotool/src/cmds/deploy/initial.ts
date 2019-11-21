import yargs from 'yargs'
import { DeployArgv } from '../deploy'
export const command = 'initial <deployPackage>'

export const describe = 'create the initial deploy of a package in the monorepo'

export type InitialArgv = DeployArgv

export const builder = (argv: yargs.Argv) => {
  return argv.commandDir('initial', { extensions: ['ts'] })
}

export const handler = () => {
  // empty
}
