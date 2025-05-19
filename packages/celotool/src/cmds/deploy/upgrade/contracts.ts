import { downloadArtifacts, uploadArtifacts } from 'src/lib/artifacts'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmd } from 'src/lib/cmd-utils'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { migrationOverrides, truffleOverrides } from 'src/lib/migration-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import yargs from 'yargs'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'contracts'

export const describe = 'upgrade the celo smart contracts'

type ContractsArgv = UpgradeArgv & {
  skipFaucetting: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('skipFaucetting', {
    describe: 'skips allocation of cUSD to any oracle or bot accounts',
    default: false,
    type: 'boolean',
  })
}

export const handler = async (argv: ContractsArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnv(argv.celoEnv)

  console.info(`Upgrading smart contracts on ${argv.celoEnv}`)
  const cb = async () => {
    await execCmd(
      `yarn --cwd ../protocol run devchain:migrate -n ${argv.celoEnv} -c '${JSON.stringify(
        truffleOverrides()
      )}' -m '${JSON.stringify(await migrationOverrides(!argv.skipFaucetting))}'`
    )
  }

  try {
    await downloadArtifacts(argv.celoEnv)
    await portForwardAnd(argv.celoEnv, cb)
    await uploadArtifacts(argv.celoEnv)
    process.exit(0)
  } catch (error) {
    console.error(`Unable to upgrade smart contracts on ${argv.celoEnv}`)
    console.error(error)
    process.exit(1)
  }
}
