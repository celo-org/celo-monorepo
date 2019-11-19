import yargs from 'yargs'
import { DeployArgv } from '../deploy'
export const command = 'upgrade <deployPackage>'

export const describe = 'upgrade an existing deploy'

export type UpgradeArgv = DeployArgv

export const builder = (argv: yargs.Argv) => {
  return argv.commandDir('upgrade', { extensions: ['ts'] })
}

export const handler = () => {
  // empty
}
