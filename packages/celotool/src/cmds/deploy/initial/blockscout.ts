import {
  createDefaultIngressIfNotExists,
  getInstanceName,
  getReleaseName,
  installHelmChart,
} from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import {
  createAndUploadCloudSQLSecretIfNotExists,
  createCloudSQLInstance,
  getServiceAccountName,
  grantRoles,
  isCelotoolHelmDryRun,
} from 'src/lib/helm_deploy'
import { createServiceAccountIfNotExists } from 'src/lib/service-account-utils'
import { InitialArgv } from '../../deploy/initial'

export const command = 'blockscout'

export const describe = 'deploy the blockscout package'

export const handler = async (argv: InitialArgv) => {
  const instanceName = getInstanceName(argv.celoEnv)
  const helmReleaseName = getReleaseName(argv.celoEnv)
  await switchToClusterFromEnv()
  let blockscoutCredentials: string[] = [
    'dummyUser',
    'dummyPassword',
    'dummy-project:region:instance',
  ]

  if (!isCelotoolHelmDryRun()) {
    // Create cloud SQL account with 'Cloud SQL Client' permissions.
    const cloudSqlServiceAccountName = getServiceAccountName('cloud-sql-for')
    await createServiceAccountIfNotExists(cloudSqlServiceAccountName)

    await grantRoles(cloudSqlServiceAccountName, 'roles/cloudsql.client')

    await createAndUploadCloudSQLSecretIfNotExists(cloudSqlServiceAccountName)

    blockscoutCredentials = await createCloudSQLInstance(argv.celoEnv, instanceName)
  } else {
    console.info(
      `Skipping Cloud SQL Database creation and IAM setup. Please check if you can execute the skipped steps.`
    )
  }

  await installHelmChart(
    argv.celoEnv,
    helmReleaseName,
    blockscoutCredentials[0],
    blockscoutCredentials[1],
    blockscoutCredentials[2]
  )

  if (!isCelotoolHelmDryRun()) {
    await createDefaultIngressIfNotExists(argv.celoEnv, helmReleaseName)
  }
}
