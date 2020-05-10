import * as deployUtil from '@celo/verification-pool-api/deployment/deployment-utils'
import { envVar, fetchEnvOrFallback } from 'src/lib/env-utils'
import { getVerificationPoolConfig } from 'src/lib/utils'
import { InitialArgv } from '../../deploy/initial'

export const command = 'verification-pool'
export const describe = 'Intialize a new deploy of the verification pool package'

export const builder = {}

export const handler = async (argv: InitialArgv) => {
  const vpConfig = await getVerificationPoolConfig(argv.celoEnv)
  const projName = fetchEnvOrFallback(envVar.TESTNET_PROJECT_NAME, 'celo-testnet')
  console.info(`Deploying new verification pool ${argv.celoEnv} in proj ${projName}`)
  await deployUtil.setProject(projName)
  await deployUtil.setEnv(argv.celoEnv)
  await deployUtil.setConfig(argv.celoEnv, vpConfig.testnetId, vpConfig.txIP, vpConfig.txPort, '')
  await deployUtil.deploy(argv.celoEnv)
}
