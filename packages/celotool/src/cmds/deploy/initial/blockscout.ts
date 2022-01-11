import {
  createDefaultIngressIfNotExists,
  getInstanceName,
  getReleaseName,
  installHelmChart,
} from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { envVar, fetchEnv, fetchEnvOrFallback } from 'src/lib/env-utils'
import {
  createAndUploadCloudSQLSecretIfNotExists,
  createCloudSQLInstance,
  createSecretInSecretManagerIfNotExists,
  getServiceAccountName,
  grantRoles,
  isCelotoolHelmDryRun,
} from 'src/lib/helm_deploy'
import { createServiceAccountIfNotExists } from 'src/lib/service-account-utils'
import { InitialArgv } from '../../deploy/initial'

export const command = 'blockscout'

export const describe = 'deploy the blockscout package'

export const handler = async (argv: InitialArgv) => {
  const dbSuffix = fetchEnvOrFallback(envVar.BLOCKSCOUT_DB_SUFFIX, '')
  const imageTag = fetchEnv(envVar.BLOCKSCOUT_DOCKER_IMAGE_TAG)

  const instanceName = getInstanceName(argv.celoEnv, dbSuffix)
  const helmReleaseName = getReleaseName(argv.celoEnv, dbSuffix)
  await switchToClusterFromEnv(argv.celoEnv)

  if (!isCelotoolHelmDryRun()) {
    // Create cloud SQL account with 'Cloud SQL Client' permissions.
    const cloudSqlServiceAccountName = getServiceAccountName('cloud-sql-for')
    await createServiceAccountIfNotExists(cloudSqlServiceAccountName)

    await grantRoles(cloudSqlServiceAccountName, 'roles/cloudsql.client')

    await createAndUploadCloudSQLSecretIfNotExists(cloudSqlServiceAccountName, argv.celoEnv)

    const [dbUser, dbPassword, _] = await createCloudSQLInstance(argv.celoEnv, instanceName)
    const secretLabels = ['app=blockscout', `env=${argv.celoEnv}`]

    await createSecretInSecretManagerIfNotExists(`${helmReleaseName}-dbUser`, secretLabels, dbUser)

    await createSecretInSecretManagerIfNotExists(
      `${helmReleaseName}-dbPassword`,
      secretLabels,
      dbPassword
    )

    await createSecretInSecretManagerIfNotExists(
      `${helmReleaseName}-dbUrl`,
      secretLabels,
      `postgres://${dbUser}:${dbPassword}@127.0.0.1:5432/blockscout`
    )
  } else {
    console.info(
      `Skipping Cloud SQL Database creation and IAM setup. Please check if you can execute the skipped steps.`
    )
  }

  await installHelmChart(argv.celoEnv, helmReleaseName, imageTag)

  if (!isCelotoolHelmDryRun()) {
    await createDefaultIngressIfNotExists(argv.celoEnv, helmReleaseName)
  }
}
