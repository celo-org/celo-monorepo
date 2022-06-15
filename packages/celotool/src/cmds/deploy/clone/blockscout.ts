import { getInstanceName, getReleaseName, installHelmChart } from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { envVar, fetchEnv, fetchEnvOrFallback } from 'src/lib/env-utils'
import {
  cloneCloudSQLInstance,
  createAndUploadCloudSQLSecretIfNotExists,
  getServiceAccountName,
  grantRoles,
  isCelotoolHelmDryRun,
} from 'src/lib/helm_deploy'
import yargs from 'yargs'
import { CloneArgv } from '../../deploy/clone'

export const command = 'blockscout'
export const describe = 'clone an existing instance to quickly deploy and test blockscout package'

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('tag', {
      type: 'string',
      description: 'Docker image tag to deploy',
    })
    .option('suffix', {
      type: 'string',
      description: 'Instance suffix',
      default: '',
    })
    .option('newSuffix', {
      type: 'string',
      description: 'Instance suffix',
      default: '',
    })
    .demandOption(['tag'])
}

type BlockscoutUpgradeArgv = CloneArgv & {
  tag: string
  suffix: string
  newSuffix: string
}

export const handler = async (argv: BlockscoutUpgradeArgv) => {
  const dbSuffix = argv.suffix || fetchEnvOrFallback(envVar.BLOCKSCOUT_DB_SUFFIX, '')
  const newSuffix = argv.newSuffix || fetchEnvOrFallback(envVar.BLOCKSCOUT_DB_NEW_SUFFIX, '')
  const imageTag = argv.tag || fetchEnv(envVar.BLOCKSCOUT_DOCKER_IMAGE_TAG)

  const instanceName = getInstanceName(argv.celoEnv, dbSuffix)
  const newInstanceName = getInstanceName(argv.celoEnv, newSuffix)
  const helmReleaseName = getReleaseName(argv.celoEnv, newSuffix)
  await switchToClusterFromEnv(argv.celoEnv)
  let blockscoutCredentials: string[] = [
    'dummyUser',
    'dummyPassword',
    'dummy-project:region:instance',
  ]

  if (!isCelotoolHelmDryRun()) {
    // Create cloud SQL account with 'Cloud SQL Client' permissions.
    const cloudSqlServiceAccountName = getServiceAccountName('cloud-sql-for')
    await grantRoles(cloudSqlServiceAccountName, 'roles/cloudsql.client')

    await createAndUploadCloudSQLSecretIfNotExists(cloudSqlServiceAccountName, argv.celoEnv)

    blockscoutCredentials = await cloneCloudSQLInstance(argv.celoEnv, instanceName, newInstanceName)
  } else {
    console.info(
      `Skipping Cloud SQL Database creation and IAM setup. Please check if you can execute the skipped steps.`
    )
  }

  await installHelmChart(
    argv.celoEnv,
    helmReleaseName,
    imageTag,
    blockscoutCredentials[0],
    blockscoutCredentials[1],
    blockscoutCredentials[2]
  )

  // if (!isCelotoolHelmDryRun()) {
  //   await createGrafanaTagAnnotation(argv.celoEnv, imageTag, newSuffix)
  //   await createDefaultIngressIfNotExists(argv.celoEnv, helmReleaseName)
  // }
}
