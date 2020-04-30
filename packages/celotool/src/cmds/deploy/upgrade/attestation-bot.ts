import { upgradeHelmChart } from 'src/lib/attestation-bot'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import yargs from 'yargs'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'attestation-bot'

export const describe = 'deploy attestation-bot'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: UpgradeArgv) => {
  await switchToClusterFromEnv()
  await upgradeHelmChart(argv.celoEnv)
}
