import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import yargs from 'yargs'

export const command = 'backup'

export const describe = "command for backing up a miner's persistent volume (PVC)"

interface BackupArgv extends CeloEnvArgv {
  minername: string
}

export const builder = (args: yargs.Argv) => {
  return addCeloEnvMiddleware(args).option('minername', {
    type: 'string',
    description: 'Name of the miner node',
    demand: 'Please specify the miner node to backup, eg. gethminer1',
  })
}

export const handler = async (argv: BackupArgv) => {
  await switchToClusterFromEnv(false)

  const minerName = argv.minername
  // In the future, we can make this configurable.
  const zone = 'us-west1-a'
  const namespace = argv.celoEnv
  const pvc = `${namespace}-${minerName}-pvc`

  const getPVCNameCommand = `kubectl get persistentvolumeclaim ${pvc} --namespace ${namespace} -o=jsonpath={.spec.volumeName}`
  const pvcId = (await execCmdWithExitOnFailure(getPVCNameCommand))[0]
  console.debug(`Persistent Volume Claim is ${pvcId}`)
  const getPDNameCommand = `kubectl get persistentvolume ${pvcId} -o=jsonpath={.spec.gcePersistentDisk.pdName}`
  const pdId = (await execCmdWithExitOnFailure(getPDNameCommand))[0]
  console.debug(`Persistent Disk is ${pdId}`)

  const snapshotName = `snapshot-${namespace}-${minerName}-pvc-${Date.now()}`
  const createSnapshotCommand = `gcloud compute disks snapshot ${pdId} --zone ${zone} --snapshot-names ${snapshotName}`
  await execCmdWithExitOnFailure(createSnapshotCommand)
  const gcloudSnapshotsUrl = 'https://console.cloud.google.com/compute/snapshots'
  console.info(`Snapshot \"${snapshotName}\" can be seen at ${gcloudSnapshotsUrl}`)
}
