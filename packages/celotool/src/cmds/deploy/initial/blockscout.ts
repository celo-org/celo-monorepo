import {
  createDefaultIngressIfNotExists,
  getInstanceName,
  getReleaseName,
  installHelmChart,
} from 'src/lib/blockscout'
import { createClusterIfNotExists, setupCluster, switchToClusterFromEnv } from 'src/lib/cluster'
import {
  createAndUploadCloudSQLSecretIfNotExists,
  createCloudSQLInstance,
  getServiceAccountName,
  grantRoles,
} from 'src/lib/helm_deploy'
import { createServiceAccountIfNotExists } from 'src/lib/service-account-utils'
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

  const instanceName = getInstanceName(argv.celoEnv)
  const helmReleaseName = getReleaseName(argv.celoEnv)

  const [
    blockscoutDBUsername,
    blockscoutDBPassword,
    blockscoutDBConnectionName,
  ] = await createCloudSQLInstance(argv.celoEnv, instanceName)

  await installHelmChart(
    argv.celoEnv,
    helmReleaseName,
    blockscoutDBUsername,
    blockscoutDBPassword,
    blockscoutDBConnectionName
  )

  await createDefaultIngressIfNotExists(argv.celoEnv, helmReleaseName)
}
