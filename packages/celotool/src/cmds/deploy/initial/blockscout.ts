import { installHelmChart } from 'src/lib/blockscout'
import { createClusterIfNotExists, setupCluster, switchToClusterFromEnv } from 'src/lib/cluster'
import { fetchEnvOrFallback } from 'src/lib/env-utils'
import {
  createAndUploadCloudSQLSecretIfNotExists,
  createCloudSQLInstance,
  createServiceAccountIfNotExists,
  getServiceAccountName,
  grantRoles,
} from 'src/lib/helm_deploy'
import yargs from 'yargs'
import { InitialArgv } from '../../deploy/initial'

export const command = 'blockscout'

export const describe = 'deploy the blockscout package'

export const builder = (argv: yargs.Argv) => {
  return argv.option('skipClusterSetup', {
    type: 'boolean',
    description: 'If you know that you can skip the cluster setup',
    default: false,
  })
}

type BlockscoutInitialArgv = InitialArgv & { skipClusterSetup: boolean }

export const handler = async (argv: BlockscoutInitialArgv) => {
  const createdCluster = await createClusterIfNotExists()
  await switchToClusterFromEnv()

  if (!argv.skipClusterSetup) {
    await setupCluster(argv.celoEnv, createdCluster)
  }

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
    blockscoutDBConnectionName
  )
}
