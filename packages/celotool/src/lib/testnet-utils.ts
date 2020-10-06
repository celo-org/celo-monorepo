import { StaticNodeUtils } from '@celo/contractkit'
import { GenesisBlocksGoogleStorageBucketName } from '@celo/contractkit/lib/network-utils/genesis-block-utils'
import { Storage } from '@google-cloud/storage'
import * as fs from 'fs'
import fetch from 'node-fetch'
import * as path from 'path'
import { retryCmd } from '../lib/utils'
import { execCmdWithExitOnFailure } from './cmd-utils'
import { getGenesisGoogleStorageUrl } from './endpoints'
import { envVar, fetchEnvOrFallback, getEnvFile } from './env-utils'
import { ensureAuthenticatedGcloudAccount } from './gcloud_utils'
import { generateGenesisFromEnv } from './generate_utils'
import { getBootnodeEnode, getEnodesWithExternalIPAddresses } from './geth'
const genesisBlocksBucketName = GenesisBlocksGoogleStorageBucketName
const staticNodesBucketName = StaticNodeUtils.getStaticNodesGoogleStorageBucketName()
// Someone has taken env_files and I don't even has permission to modify it :/
// See files in this bucket using `$ gsutil ls gs://env_config_files`
const envBucketName = 'env_config_files'
const bootnodesBucketName = 'env_bootnodes'

// uploads genesis block, static nodes, env file, and bootnode to GCS
export async function uploadTestnetInfoToGoogleStorage(
  networkName: string,
  uploadGenesis: boolean
) {
  if (uploadGenesis) {
    await uploadGenesisBlockToGoogleStorage(networkName)
  }
  await uploadStaticNodesToGoogleStorage(networkName)
  await uploadBootnodeToGoogleStorage(networkName)
  await uploadEnvFileToGoogleStorage(networkName)
}

export async function uploadGenesisBlockToGoogleStorage(networkName: string) {
  console.info(`\nUploading genesis block for ${networkName} to Google cloud storage`)
  const genesisBlockJsonData = generateGenesisFromEnv()
  console.debug(`Genesis block is ${genesisBlockJsonData} \n`)
  await uploadDataToGoogleStorage(
    genesisBlockJsonData,
    genesisBlocksBucketName,
    networkName,
    true,
    'application/json'
  )
}

export async function getGenesisBlockFromGoogleStorage(networkName: string) {
  const resp = await fetch(getGenesisGoogleStorageUrl(networkName))
  return JSON.stringify(await resp.json())
}

// This will throw an error if it fails to upload
export async function uploadStaticNodesToGoogleStorage(networkName: string) {
  console.info(`\nUploading static nodes for ${networkName} to Google cloud storage...`)
  // Get node json file
  const nodesData: string[] | null = await retryCmd(() =>
    getEnodesWithExternalIPAddresses(networkName)
  )
  if (nodesData === null) {
    throw new Error('Fail to get static nodes information')
  }
  const nodesJson = JSON.stringify(nodesData)
  console.debug('Static nodes are ' + nodesJson + '\n')
  await uploadDataToGoogleStorage(
    nodesJson,
    staticNodesBucketName,
    networkName,
    true,
    'application/json'
  )
}

export async function uploadBootnodeToGoogleStorage(networkName: string) {
  console.info(`\nUploading bootnode for ${networkName} to Google Cloud Storage...`)
  const [bootnodeEnode] = await retryCmd(() => getBootnodeEnode(networkName))
  if (!bootnodeEnode) {
    throw new Error('Failed to get bootnode enode')
  }
  // for now there is always only one bootnodde
  console.info('Bootnode enode:', bootnodeEnode)
  await uploadDataToGoogleStorage(
    bootnodeEnode,
    bootnodesBucketName,
    networkName,
    true, // make it public
    'text/plain'
  )
}

export async function uploadEnvFileToGoogleStorage(networkName: string) {
  const envFileName = getEnvFile(networkName)
  const userInfo = `${await getGoogleCloudUserInfo()}`
  const repo = await getGitRepoName()
  const commitHash = await getCommitHash()

  console.info(
    `\nUploading Env file ${envFileName} for network ${networkName} to Google cloud storage: ` +
      `gs://${envBucketName}/${networkName}`
  )
  const envFileData = fs.readFileSync(getEnvFile(networkName)).toString()
  const metaData =
    `# .env file for network "${networkName}"\n` +
    `# Last modified by "${userInfo}"\n` +
    `# Last modified on on ${Date()}\n` +
    `# Base commit: "https://github.com/${repo}/commit/${commitHash}"\n`
  const fullData = metaData + '\n' + envFileData
  await uploadDataToGoogleStorage(
    fullData,
    envBucketName,
    networkName,
    false /* keep file private */,
    'text/plain'
  )
}

async function getGoogleCloudUserInfo(): Promise<string> {
  const cmd = 'gcloud config get-value account'
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

// Writes data to a temporary file & uploads it to GCS
export function uploadDataToGoogleStorage(
  data: any,
  googleStorageBucketName: string,
  googleStorageFileName: string,
  makeFileWorldReadable: boolean,
  contentType: string
) {
  const localTmpFilePath = `/tmp/${googleStorageBucketName}-${googleStorageFileName}`
  // @ts-ignore The expected type of this is not accurate
  fs.mkdirSync(path.dirname(localTmpFilePath), {
    recursive: true,
  })
  fs.writeFileSync(localTmpFilePath, data)
  return uploadFileToGoogleStorage(
    localTmpFilePath,
    googleStorageBucketName,
    googleStorageFileName,
    makeFileWorldReadable,
    contentType
  )
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

// Reads the envVar VALIDATOR_PROXY_COUNTS, which indicates how many validators
// have a certain number of proxies in the format:
// <# of validators>:<proxy count>;<# of validators>:<proxy count>;...
// For example, VALIDATOR_PROXY_COUNTS='2:1,3:2' will give [1,1,2,2,2]
// The resulting array does not necessarily have the same length as the total
// number of validators because non-proxied validators are not represented in the array
export function getProxiesPerValidator() {
  const arr = []
  const valProxyCountsStr = fetchEnvOrFallback(envVar.VALIDATOR_PROXY_COUNTS, '')
  const splitValProxyCountStrs = valProxyCountsStr.split(',').filter((counts) => counts)
  for (const valProxyCount of splitValProxyCountStrs) {
    const [valCountStr, proxyCountStr] = valProxyCount.split(':')
    const valCount = parseInt(valCountStr, 10)
    const proxyCount = parseInt(proxyCountStr, 10)
    for (let i = 0; i < valCount; i++) {
      arr.push(proxyCount)
    }
  }
  return arr
}

export function getProxyName(celoEnv: string, validatorIndex: number, proxyIndex: number) {
  return `${celoEnv}-validators-${validatorIndex}-proxy-${proxyIndex}`
}
