import yargs from 'yargs'

export const command = 'gcp <accountCommand>'

export const describe = 'commands for interacting with GCP'

export const builder = (argv: yargs.Argv) => argv.commandDir('gcp', { extensions: ['ts'] })
