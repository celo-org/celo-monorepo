import yargs from 'yargs'
import { DeployArgv } from '../deploy'
export const command = 'clone <deployPackage>'

export const describe = 'clone the initial deploy of a package in the monorepo'

export type CloneArgv = DeployArgv

export const builder = (argv: yargs.Argv) => {
  return argv.commandDir('clone', { extensions: ['ts'] })
}

export const handler = () => {
  // empty
}
