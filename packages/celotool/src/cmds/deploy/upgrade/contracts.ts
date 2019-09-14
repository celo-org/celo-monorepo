import { downloadArtifacts, uploadArtifacts } from 'src/lib/artifacts'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { portForwardAnd } from 'src/lib/port_forward'
import { execCmd } from 'src/lib/utils'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'contracts'

export const describe = 'upgrade the celo smart contracts'

export const builder = {}

export const handler = async (argv: UpgradeArgv) => {
  await switchToClusterFromEnv()

  console.info(`Upgrading smart contracts on ${argv.celoEnv}`)
  const cb = async () => {
    await execCmd(`yarn --cwd ../protocol run migrate -n ${argv.celoEnv}`)
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
