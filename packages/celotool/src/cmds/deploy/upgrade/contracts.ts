import { UpgradeArgv } from '@celo/celotool/src/cmds/deploy/upgrade'
import { downloadArtifacts, uploadArtifacts } from '@celo/celotool/src/lib/artifacts'
import { portForwardAnd } from '@celo/celotool/src/lib/port_forward'
import { execCmd } from '@celo/celotool/src/lib/utils'
import { switchToClusterFromEnv } from 'src/lib/cluster'

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
