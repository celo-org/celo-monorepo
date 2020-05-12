import { downloadArtifacts } from 'src/lib/artifacts'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmd } from 'src/lib/cmd-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import yargs from 'yargs'
import { AccountArgv } from '../account'
export const command = 'revoke'

export const describe = 'command for revoking verification of a phone number'

interface RevokeArgv extends AccountArgv {
  phone: string
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('phone', {
    type: 'string',
    description: 'Phone number to revoke verification',
    demand: 'Please specify phone number to revoke verification',
  })
}

export const handler = async (argv: RevokeArgv) => {
  await switchToClusterFromEnv(true)
  console.info(`Sending invitation code to ${argv.phone}`)
  const cb = async () => {
    await execCmd(`yarn --cwd ../protocol run revoke -n ${argv.celoEnv} -p ${argv.phone}`)
  }
  try {
    await downloadArtifacts(argv.celoEnv)
    await portForwardAnd(argv.celoEnv, cb)
  } catch (error) {
    console.error(`Unable to revoke verification for ${argv.phone}`)
    console.error(error)
    process.exit(1)
  }
}
