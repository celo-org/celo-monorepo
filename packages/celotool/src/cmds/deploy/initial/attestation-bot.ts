import { installHelmChart } from 'src/lib/attestation-bot'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import yargs from 'yargs'
import { InitialArgv } from '../../deploy/initial'

export const command = 'attestation-bot'

export const describe = 'deploy attestation-bot'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()
  await installHelmChart(argv.celoEnv)
}
