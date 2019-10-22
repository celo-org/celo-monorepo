import { upgradeHelmChart } from 'src/lib/attestation-service'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import yargs from 'yargs'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'attestation-service'

export const describe = 'upgrade the attestation-service package'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: UpgradeArgv) => {
  await switchToClusterFromEnv()
  await upgradeHelmChart(argv.celoEnv)
}
