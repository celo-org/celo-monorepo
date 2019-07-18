import { InitialArgv } from '@celo/celotool/src/cmds/deploy/initial'
import * as deployUtil from '@celo/verification-pool-api/deployment/deployment-utils'
import { envVar, fetchEnvOrFallback, getVerificationPoolConfig } from 'src/lib/utils'

export const command = 'verification-pool'
export const describe = 'Intialize a new deploy of the verification pool package'

export const builder = {}

export const handler = async (argv: InitialArgv) => {
  const vpConfig = await getVerificationPoolConfig(argv.celoEnv)
  const projName = fetchEnvOrFallback(envVar.TESTNET_PROJECT_NAME, 'celo-testnet')
  const appSignature = fetchEnvOrFallback(envVar.SMS_RETRIEVER_HASH_CODE, '')
  console.info(`Deploying new verification pool ${argv.celoEnv} in proj ${projName}`)
  await deployUtil.setProject(projName)
  await deployUtil.setEnv(argv.celoEnv)
  await deployUtil.setConfig(
    argv.celoEnv,
    vpConfig.testnetId,
    vpConfig.txIP,
    vpConfig.txPort,
    appSignature
  )
  await deployUtil.deploy(argv.celoEnv)
}
