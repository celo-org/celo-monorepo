import { UpgradeArgv } from '@celo/celotool/src/cmds/deploy/upgrade'
import * as deployUtil from '@celo/verification-pool-api/deployment/deployment-utils'
import { envVar, fetchEnvOrFallback } from 'src/lib/utils'

export const command = 'verification-pool'
export const describe = 'Upgrade an existing deploy of the verification pool package'

export const builder = {}

export const handler = async (argv: UpgradeArgv) => {
  const projName = fetchEnvOrFallback(envVar.TESTNET_PROJECT_NAME, 'celo-testnet')
  console.info(`Upgrading verification pool ${argv.celoEnv} in proj ${projName}`)
  await deployUtil.setProject(projName)
  await deployUtil.setEnv(argv.celoEnv)
  await deployUtil.deploy(argv.celoEnv)
}
