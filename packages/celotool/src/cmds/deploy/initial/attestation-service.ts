import { installHelmChart } from 'src/lib/attestation-service'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import yargs from 'yargs'
import { InitialArgv } from '../../deploy/initial'

export const command = 'attestation-service'

export const describe = 'deploy the attestation-service package'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()
  await installHelmChart(argv.celoEnv)
}
