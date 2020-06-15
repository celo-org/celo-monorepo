import { downloadArtifacts, uploadArtifacts } from 'src/lib/artifacts'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmd } from 'src/lib/cmd-utils'
import { migrationOverrides, truffleOverrides } from 'src/lib/migration-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'contracts'

export const describe = 'upgrade the celo smart contracts'

export const builder = {}

export const handler = async (argv: UpgradeArgv) => {
  await switchToClusterFromEnv()

  console.info(`Upgrading smart contracts on ${argv.celoEnv}`)
  const cb = async () => {
    await execCmd(
      `yarn --cwd ../protocol run migrate -n ${argv.celoEnv} -c '${JSON.stringify(
        truffleOverrides()
      )}' -m '${JSON.stringify(migrationOverrides())}'`
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
