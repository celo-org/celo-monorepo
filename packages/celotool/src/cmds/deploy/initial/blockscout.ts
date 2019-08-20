import { InitialArgv } from '@celo/celotool/src/cmds/deploy/initial'
import { installHelmChart } from 'src/lib/blockscout'
import { createClusterIfNotExists, switchToClusterFromEnv } from 'src/lib/cluster'
import {
  createAndUploadCloudSQLSecretIfNotExists,
  createCloudSQLInstance,
  createServiceAccountIfNotExists,
  getServiceAccountName,
  grantRoles,
} from 'src/lib/helm_deploy'
import { fetchEnvOrFallback } from 'src/lib/utils'
import yargs from 'yargs'

export const command = 'blockscout'

export const describe = 'deploy the blockscout package'

export const builder = (argv: yargs.Argv) => {
  return argv.option('vmTestnet', {
    type: 'boolean',
    description: 'Deploy blockscout for an already deployed VM testnet',
    default: false,
  })
}

type BlockscoutInitialArgv = InitialArgv & { vmTestnet: boolean }

export const handler = async (argv: BlockscoutInitialArgv) => {
  await createClusterIfNotExists()
  await switchToClusterFromEnv()

  // Create cloud SQL account with 'Cloud SQL Client' permissions.
  const cloudSqlServiceAccountName = getServiceAccountName('cloud-sql-for')
  await createServiceAccountIfNotExists(cloudSqlServiceAccountName)

  await grantRoles(cloudSqlServiceAccountName, 'roles/cloudsql.client')

  await createAndUploadCloudSQLSecretIfNotExists(cloudSqlServiceAccountName)

  const instanceName = `${argv.celoEnv}${fetchEnvOrFallback('BLOCKSCOUT_DB_SUFFIX', '')}`

  const [
    blockscoutDBUsername,
    blockscoutDBPassword,
    blockscoutDBConnectionName,
  ] = await createCloudSQLInstance(argv.celoEnv, instanceName)

  await installHelmChart(
    argv.celoEnv,
    blockscoutDBUsername,
    blockscoutDBPassword,
    blockscoutDBConnectionName,
    argv.vmTestnet
  )
}
