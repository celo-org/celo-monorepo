import {
  addOracleMiddleware,
  getOracleAzureContext,
  OracleArgv,
  removeHelmRelease,
  switchToAzureContextCluster,
} from 'src/lib/oracle'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'oracle'

export const describe = 'destroy the oracle package'

type OracleDestroyArgv = DestroyArgv & OracleArgv

export const builder = addOracleMiddleware

export const handler = async (argv: OracleDestroyArgv) => {
  const oracleAzureContext = getOracleAzureContext(argv.primary)
  await switchToAzureContextCluster(argv.celoEnv, oracleAzureContext)
  await removeHelmRelease(argv.celoEnv, oracleAzureContext)
}
