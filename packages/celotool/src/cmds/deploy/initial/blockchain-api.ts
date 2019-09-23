import { switchToClusterFromEnv } from 'src/lib/cluster'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { execCmd } from 'src/lib/utils'
import * as yargs from 'yargs'
import { InitialArgv } from '../../deploy/initial'
export const command = 'blockchain-api'

export const describe = 'command for upgrading blockchain-api'

// Can't extend because yargs.Argv already has a `config` property
type BlockchainApiArgv = InitialArgv & {
  config: string
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('config', {
    type: 'string',
    description: 'filename of config file to deploy',
    demand: 'Please specify config file to deploy',
  })
}

export const handler = async (argv: BlockchainApiArgv) => {
  await switchToClusterFromEnv()
  const testnetProjectName = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  console.info(`deploying blockchain-api for env ${argv.config} to ${testnetProjectName}`)
  await execCmd(
    `yarn --cwd ../blockchain-api run deploy --project ${testnetProjectName} ${argv.config} --quiet`
  )
  console.info(`blockchain-api deploy complete`)
}
