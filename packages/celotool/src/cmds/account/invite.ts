/* tslint:disable no-console */
import { downloadArtifacts } from 'src/lib/artifacts'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { portForwardAnd } from 'src/lib/port_forward'
import { execCmd } from 'src/lib/utils'
import { Argv } from 'yargs'
import { AccountArgv } from '../account'

export const command = 'invite'

export const describe = 'command for sending an invite code to a phone number'

interface InviteArgv extends AccountArgv {
  phone: string
}

export const builder = (yargs: Argv) => {
  return yargs.option('phone', {
    type: 'string',
    description: 'Phone number to send invite code,',
    demand: 'Please specify phone number to send invite code',
  })
}

export const handler = async (argv: InviteArgv) => {
  await switchToClusterFromEnv(false)
  console.log(`Sending invitation code to ${argv.phone}`)
  const cb = async () => {
    await execCmd(`yarn --cwd ../protocol run invite -n ${argv.celoEnv} -p ${argv.phone}`)
  }
  try {
    await downloadArtifacts(argv.celoEnv)
    await portForwardAnd(argv.celoEnv, cb)
  } catch (error) {
    console.error(`Unable to send invitation code to ${argv.phone}`)
    console.error(error)
    process.exit(1)
  }
}
