import { DestroyArgv } from '@celo/celotool/src/cmds/deploy/destroy'
import { envVar, fetchEnvOrFallback } from '@celo/celotool/src/lib/env-utils'
import * as deployUtil from '@celo/verification-pool-api/deployment/deployment-utils'

export const command = 'verification-pool'
export const describe = 'Delete an existing deploy of the verification pool package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  const projName = fetchEnvOrFallback(envVar.TESTNET_PROJECT_NAME, 'celo-testnet')
  console.info(`Deleting verification pool ${argv.celoEnv} in proj ${projName}`)
  await deployUtil.setProject(projName)
  await deployUtil.deleteDeployment(argv.celoEnv)
}
