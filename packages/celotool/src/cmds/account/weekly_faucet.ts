/* tslint:disable no-console */
import { AccountArgv } from '@celo/celotool/src/cmds/account'
import { downloadArtifacts } from '@celo/celotool/src/lib/artifacts'
import { getBlockchainApiUrl } from '@celo/celotool/src/lib/endpoints'
import { portForwardAnd } from '@celo/celotool/src/lib/port_forward'
import { execCmd } from '@celo/celotool/src/lib/utils'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import * as yargs from 'yargs'

export const command = 'weekly-faucet'

export const describe = 'command for fauceting phone numbers from a csv list'

interface WeeklyFaucetArgv extends AccountArgv {
  file: string
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('file', {
    type: 'string',
    description:
      'File with phone numbers or account addresses and amount to faucet (optional if fauceting users on a weekly basis)',
    demand: 'Please specify main csv file',
  })
}

export const handler = async (argv: WeeklyFaucetArgv) => {
  await switchToClusterFromEnv()

  console.log(`Fauceting phone numbers in ${argv.file} on ${argv.celoEnv}`)
  const cb = async () => {
    const [output] = await execCmd(
      `yarn --cwd ../protocol run weekly-faucet -n ${argv.celoEnv} -f ${
        argv.file
      } -b ${getBlockchainApiUrl(argv)}`
    )
    console.log(output)
  }

  try {
    await downloadArtifacts(argv.celoEnv)
    await portForwardAnd(argv.celoEnv, cb)
  } catch (error) {
    console.error(`Unable to faucet phone numbers in ${argv.file} on ${argv.celoEnv}`)
    console.error(error)
    process.exit(1)
  }
}
