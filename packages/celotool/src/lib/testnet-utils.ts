import { BootnodeUtils, StaticNodeUtils } from '@celo/walletkit'
import { Storage } from '@google-cloud/storage'
import { writeFileSync } from 'fs'
import { ensureAuthenticatedGcloudAccount } from './gcloud_utils'
import { generateGenesisFromEnv } from './generate_utils'
import { getBootnodeEnodes, getEnodesWithExternalIPAddresses, sleep } from './geth'

const bootnodesBucketName = BootnodeUtils.getBootnodesGoogleStorageBucketName()
const genesisBlocksBucketName = 'genesis_blocks'
const staticNodesBucketName = StaticNodeUtils.getStaticNodesGoogleStorageBucketName()

export async function uploadGenesisBlockToGoogleStorage(networkName: string) {
  console.info(`\nUploading genesis block for ${networkName} to Google cloud storage`)
  const genesisBlockJsonData = await generateGenesisFromEnv()
  console.debug(`Genesis block is ${genesisBlockJsonData} \n`)
  const localTmpFilePath = `/tmp/${networkName}_genesis-block`
  writeFileSync(localTmpFilePath, genesisBlockJsonData)
  await uploadFileToGoogleStorage(localTmpFilePath, genesisBlocksBucketName, networkName, true)
}

// This will throw an error if it fails to upload
export async function uploadStaticNodesToGoogleStorage(networkName: string) {
  console.info(`\nUploading static nodes for ${networkName} to Google cloud storage...`)
  // Get node json file
  let nodesJsonData: string | null = null
  nodesJsonData = await tryNTimes(
    async () => JSON.stringify(await getEnodesWithExternalIPAddresses(networkName)),
    100
  )
  if (nodesJsonData === null) {
    throw new Error('Fail to get static nodes information')
  }
  console.debug('Static nodes are ' + nodesJsonData + '\n')
  const localTmpFilePath = `/tmp/${networkName}_static-nodes`
  writeFileSync(localTmpFilePath, nodesJsonData)
  await uploadFileToGoogleStorage(localTmpFilePath, staticNodesBucketName, networkName, true)
}

// only intended to be used for VM testnets because non-VM testnets do not support
// discovery v5 due to udp IP issues
export async function uploadBootnodesToGoogleStorage(celoEnv: string) {
  console.info(`\nUploading bootnodes for ${celoEnv} to Google cloud storage...`)
  const bootnodeEnodesJson = await tryNTimes(
    async () => JSON.stringify(await getBootnodeEnodes(celoEnv)),
    100
  )
  if (!bootnodeEnodesJson) {
    throw new Error('Failed to get bootnode enodes')
  }
  console.debug('Bootnode enodes are ' + bootnodeEnodesJson + '\n')
  const localTmpFilePath = `/tmp/${celoEnv}_bootnodes`
  writeFileSync(localTmpFilePath, bootnodeEnodesJson)
  await uploadFileToGoogleStorage(localTmpFilePath, bootnodesBucketName, celoEnv, true)
}

async function tryNTimes(action: () => Promise<any>, attempts: number) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const result = await action()
      return result
    } catch (error) {
      const sleepTimeBasisInMs = 1000
      const sleepTimeInMs = sleepTimeBasisInMs * Math.pow(2, i)
      console.warn(
        `${new Date().toLocaleTimeString()} Action failed, attempt: ${i}/${attempts}, ` +
          `retry after sleeping for ${sleepTimeInMs} milli-seconds`,
        error
      )
      await sleep(sleepTimeInMs)
    }
  }
}

// TODO(yerdua): make this communicate or handle auth issues reasonably. Ideally,
//   it should catch an auth error and tell the user to login with `gcloud auth login`.
//   So, if you run into an error that says something about being unauthorized,
//   copy and paste this into your terminal: gcloud auth login
// One can browse these files at https://console.cloud.google.com/storage/browser
export async function uploadFileToGoogleStorage(
  localFilePath: string,
  googleStorageBucketName: string,
  googleStorageFileName: string,
  makeFileWorldReadable: boolean
) {
  await ensureAuthenticatedGcloudAccount()
  const storage = new Storage()
  await storage.bucket(googleStorageBucketName).upload(localFilePath, {
    destination: googleStorageFileName,
    contentType: 'application/json',
    metadata: {
      cacheControl: 'private',
    },
  })

  if (makeFileWorldReadable) {
    // set the permission to be world-readable
    await storage
      .bucket(googleStorageBucketName)
      .file(googleStorageFileName)
      .acl.add({
        entity: 'allUsers',
        role: storage.acl.READER_ROLE,
      })
  }
}
