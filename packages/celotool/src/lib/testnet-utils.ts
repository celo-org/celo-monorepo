import { StaticNodeUtils } from '@celo/walletkit'
import { Storage } from '@google-cloud/storage'
import { writeFileSync } from 'fs'
import { ensureAuthenticatedGcloudAccount } from './gcloud_utils'
import { generateGenesisFromEnv } from './generate_utils'
import { getEnodesWithExternalIPAddresses, sleep } from './geth'

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
  const numAttempts = 100
  for (let i = 1; i <= numAttempts; i++) {
    try {
      nodesJsonData = JSON.stringify(await getEnodesWithExternalIPAddresses(networkName))
      break
    } catch (error) {
      const sleepTimeBasisInMs = 1000
      const sleepTimeInMs = sleepTimeBasisInMs * Math.pow(2, i)
      console.warn(
        `${new Date().toLocaleTimeString()} Failed to get static nodes information, attempt: ${i}/${numAttempts}, ` +
          `retry after sleeping for ${sleepTimeInMs} milli-seconds`,
        error
      )
      await sleep(sleepTimeInMs)
    }
  }
  if (nodesJsonData === null) {
    throw new Error('Fail to get static nodes information')
  }
  console.debug('Static nodes are ' + nodesJsonData + '\n')
  const localTmpFilePath = `/tmp/${networkName}_static-nodes`
  writeFileSync(localTmpFilePath, nodesJsonData)
  await uploadFileToGoogleStorage(localTmpFilePath, staticNodesBucketName, networkName, true)
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
