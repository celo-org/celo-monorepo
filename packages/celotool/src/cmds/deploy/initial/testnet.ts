import { InitialArgv } from '@celo/celotool/src/cmds/deploy/initial'
import {
  createClusterIfNotExists,
  pollForRunningCluster,
  setClusterLabels,
  switchToClusterFromEnv,
} from 'src/lib/cluster'
import {
  createAndUploadBackupSecretIfNotExists,
  createServiceAccountIfNotExists,
  createStaticIPs,
  getServiceAccountName,
  grantRoles,
  installAndEnableMetricsDeps,
  installHelmChart,
  installLegoAndNginx,
  pollForBootnodeLoadBalancer,
  redeployTiller,
  uploadStorageClass,
} from 'src/lib/helm_deploy'
import {
  uploadGenesisBlockToGoogleStorage,
  uploadStaticNodesToGoogleStorage,
} from 'src/lib/testnet-utils'
import { EnvTypes, envVar, execCmdWithExitOnFailure, fetchEnv, outputIncludes } from 'src/lib/utils'
import yargs from 'yargs'

export const command = 'testnet'

export const describe = 'deploy the testnet package'

export const builder = (argv: yargs.Argv) => {
  return argv.option('skipClusterSetup', {
    type: 'boolean',
    description: 'If you know that you can skip the cluster setup',
    default: false,
  })
}

type TestnetInitialArgv = InitialArgv & { skipClusterSetup: boolean }

export const handler = async (argv: TestnetInitialArgv) => {
  const envType = fetchEnv(envVar.ENV_TYPE)

  if (!argv.skipClusterSetup) {
    const createdCluster = await createClusterIfNotExists()
    await switchToClusterFromEnv()

    const namespaceExists = await outputIncludes(
      `kubectl get namespaces ${argv.celoEnv} || true`,
      argv.celoEnv,
      `Namespace ${argv.celoEnv} exists, skipping creation`
    )
    if (!namespaceExists) {
      console.info('Creating kubernetes namespace')
      await execCmdWithExitOnFailure(`kubectl create namespace ${argv.celoEnv}`)
    }

    const blockchainBackupServiceAccountName = getServiceAccountName('blockchain-backup-for')
    console.info(
      `Service account for blockchain backup is \"${blockchainBackupServiceAccountName}\"`
    )

    await createServiceAccountIfNotExists(blockchainBackupServiceAccountName)
    // This role is required for "compute.snapshots.get" permission
    // Source: https://cloud.google.com/compute/docs/access/iam
    await grantRoles(blockchainBackupServiceAccountName, 'roles/compute.storageAdmin')
    // This role is required for "gcloud.container.clusters.get-credentials" permission
    // This role is required for "container.clusters.get" permission
    // Source: https://cloud.google.com/kubernetes-engine/docs/how-to/iam
    await grantRoles(blockchainBackupServiceAccountName, 'roles/container.viewer')

    await createAndUploadBackupSecretIfNotExists(blockchainBackupServiceAccountName)

    // poll for cluster availability
    if (createdCluster) {
      await pollForRunningCluster()
    }

    console.info('Deploying Tiller and Helm chart...')

    await uploadStorageClass()
    await redeployTiller()

    await installLegoAndNginx()

    if (envType !== EnvTypes.DEVELOPMENT) {
      await installAndEnableMetricsDeps()
    } else {
      console.info('Skipping metrics installation for this development env.')
    }

    await setClusterLabels(argv.celoEnv)
  }

  await createStaticIPs(argv.celoEnv)

  await installHelmChart(argv.celoEnv)
  // When using an external bootnode, we have to await the bootnode's LB to be up first
  await pollForBootnodeLoadBalancer(argv.celoEnv)

  await uploadGenesisBlockToGoogleStorage(argv.celoEnv)
  await uploadStaticNodesToGoogleStorage(argv.celoEnv)
}
