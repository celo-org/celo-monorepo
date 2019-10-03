import { StaticNodeUtils } from '@celo/walletkit'
import { GenesisBlocksGoogleStorageBucketName } from '@celo/walletkit/lib/src/genesis-block-utils'
import { Storage } from '@google-cloud/storage'
import * as fs from 'fs'
import { getEnvFile } from './env-utils'
import { ensureAuthenticatedGcloudAccount } from './gcloud_utils'
import { generateGenesisFromEnv } from './generate_utils'
import { getEnodesWithExternalIPAddresses, sleep } from './geth'
import { execCmdWithExitOnFailure } from './utils'

const genesisBlocksBucketName = GenesisBlocksGoogleStorageBucketName
const staticNodesBucketName = StaticNodeUtils.getStaticNodesGoogleStorageBucketName()
// Someone has taken env_files and I don't even has permission to modify it :/
// See files in this bucket using `$ gsutil ls gs://env_config_files`
const envBucketName = 'env_config_files'

export async function uploadGenesisBlockToGoogleStorage(networkName: string) {
  console.info(`\nUploading genesis block for ${networkName} to Google cloud storage`)
  const genesisBlockJsonData = generateGenesisFromEnv()
  console.debug(`Genesis block is ${genesisBlockJsonData} \n`)
  const localTmpFilePath = `/tmp/${networkName}_genesis-block`
  fs.writeFileSync(localTmpFilePath, genesisBlockJsonData)
  await uploadFileToGoogleStorage(
    localTmpFilePath,
    genesisBlocksBucketName,
    networkName,
    true,
    'application/json'
  )
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
  fs.writeFileSync(localTmpFilePath, nodesJsonData)
  await uploadFileToGoogleStorage(
    localTmpFilePath,
    staticNodesBucketName,
    networkName,
    true,
    'application/json'
  )
}

export async function uploadEnvFileToGoogleStorage(networkName: string) {
  const envFileName = getEnvFile(networkName)
  const gitUserInfo = `${await getGitUserName()} <${await getGitUserEmail()}>`
  const repo = await getGitRepoName()
  const commitHash = await getCommitHash()

  console.info(
    `\nUploading Env file ${envFileName} for network ${networkName} to Google cloud storage: ` +
      `gs://${envBucketName}/${networkName}`
  )
  const envFileData = fs.readFileSync(getEnvFile(networkName)).toString()
  const metaData =
    `# .env file for network "${networkName}"\n` +
    `# Last modified by "${gitUserInfo}"\n` +
    `# Last modified on on ${Date()}\n` +
    `# Base commit: "https://github.com/${repo}/commit/${commitHash}"\n`
  const fullData = metaData + '\n' + envFileData
  const localTmpFilePath = `/tmp/${networkName}_env-file`
  fs.writeFileSync(localTmpFilePath, fullData)
  await uploadFileToGoogleStorage(
    localTmpFilePath,
    envBucketName,
    networkName,
    false /* keep file private */,
    'text/plain'
  )
}

async function getGitUserName(): Promise<string> {
  const cmd = 'git config --get user.name'
  const stdout = (await execCmdWithExitOnFailure(cmd))[0]
  return stdout.trim()
}

async function getGitUserEmail(): Promise<string> {
  const cmd = 'git config --get user.email'
  const stdout = (await execCmdWithExitOnFailure(cmd))[0]
  return stdout.trim()
}

async function getGitRepoName(): Promise<string> {
  const cmd = 'git config --get remote.origin.url'
  let stdout = (await execCmdWithExitOnFailure(cmd))[0].trim()
  stdout = stdout.split(':')[1]
  if (stdout.endsWith('.git')) {
    stdout = stdout.substring(0, stdout.length - '.git'.length)
  }
  return stdout
}

async function getCommitHash(): Promise<string> {
  const cmd = 'git show | head -n 1'
  const stdout = (await execCmdWithExitOnFailure(cmd))[0]
  return stdout.split(' ')[1].trim()
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
  makeFileWorldReadable: boolean,
  contentType: string
) {
  await ensureAuthenticatedGcloudAccount()
  const storage = new Storage()
  await storage.bucket(googleStorageBucketName).upload(localFilePath, {
    destination: googleStorageFileName,
    contentType,
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
