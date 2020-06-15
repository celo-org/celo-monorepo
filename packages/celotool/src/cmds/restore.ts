import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import yargs from 'yargs'

export const command = 'restore'

export const describe = "command for restoring a miner's persistent volume (PVC) from snapshot"

interface RestoreArgv extends CeloEnvArgv {
  minername: string
  snapshotname: string
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .option('minername', {
      type: 'string',
      description: 'Name of the miner node',
      demand: 'Please specify the miner node to restore, eg. gethminer1',
    })
    .option('snapshotname', {
      type: 'string',
      description: 'Name of the snapshot',
      demand: 'Name of the snapshot (from gcloud compute snapshots list)',
    })
}

export const handler = async (argv: RestoreArgv) => {
  await switchToClusterFromEnv(true)

  const minerName = argv.minername
  // In the future, we can make this configurable.
  // const zone = 'us-west1-a'
  // In the future, we can make this configurable.
  const clusterName = 'celo-networks-dev'
  const diskType = 'pd-ssd'
  const namespace = argv.celoEnv
  const pvc = `${namespace}-${minerName}-pvc`
  // TODO: figure out how to make this confgurable

  const getPVCNameCommand = `kubectl get persistentvolumeclaim ${pvc} --namespace ${namespace} -o=jsonpath={.spec.volumeName}`
  const pvcId = (await execCmdWithExitOnFailure(getPVCNameCommand))[0]
  const pvcFullId = `gke-${clusterName}--${pvcId}`
  console.debug(`PVC name is ${pvcFullId}`)

  // If the disk already exists, then this command will fail and in that case,
  // the disk has to be deleted first via `gcloud compute disks delete ${pvcFullId}`
  // That itself requires that the miner node be stopped.
  // For now, this step is intentionally manual.
  // When we encounter a real world use-case of restore, we can decide whether to automate this or not.
  const restoreSnapshotCmd = `gcloud compute disks create ${pvcFullId} --source-snapshot=${argv.snapshotname} --type ${diskType}`
  await execCmdWithExitOnFailure(restoreSnapshotCmd)
  // const gcloudSnapshotsUrl = 'https://console.cloud.google.com/compute/snapshots'
  // console.info(`Snapshot \"${snapshotName}\" can be seen at ${gcloudSnapshotsUrl}`)
}
