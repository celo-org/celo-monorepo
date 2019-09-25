import { writeFileSync } from 'fs'
import { confirmAction, envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'
import {
  AccountType,
  generateGenesisFromEnv,
  generatePrivateKey,
  privateKeyToAddress,
  privateKeyToPublicKey,
} from './generate_utils'
import {
  applyTerraformModule,
  destroyTerraformModule,
  getTerraformModuleOutputs,
  getTerraformModuleResourceNames,
  initTerraformModule,
  planTerraformModule,
  taintTerraformModuleResource,
  TerraformVars,
  untaintTerraformModuleResource,
} from './terraform'
import {
  uploadEnvFileToGoogleStorage,
  uploadFileToGoogleStorage,
  uploadGenesisBlockToGoogleStorage,
} from './testnet-utils'

const secretsBucketName = 'celo-testnet-secrets'
const testnetTerraformModule = 'testnet'
const testnetNetworkTerraformModule = 'testnet-network'

// The keys correspond to the variable names that Terraform expects and
// the values correspond to the names of the appropriate env variables
const testnetEnvVars: TerraformVars = {
  block_time: envVar.BLOCK_TIME,
  celo_env: envVar.CELOTOOL_CELOENV,
  gcloud_credentials_path: envVar.GOOGLE_APPLICATION_CREDENTIALS,
  gcloud_project: envVar.TESTNET_PROJECT_NAME,
  geth_verbosity: envVar.GETH_VERBOSITY,
  geth_bootnode_docker_image_repository: envVar.GETH_BOOTNODE_DOCKER_IMAGE_REPOSITORY,
  geth_bootnode_docker_image_tag: envVar.GETH_BOOTNODE_DOCKER_IMAGE_TAG,
  geth_node_docker_image_repository: envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY,
  geth_node_docker_image_tag: envVar.GETH_NODE_DOCKER_IMAGE_TAG,
  network_id: envVar.NETWORK_ID,
  tx_node_count: envVar.TX_NODES,
  validator_count: envVar.VALIDATORS,
  verification_pool_url: envVar.VERIFICATION_POOL_URL,
}

const testnetNetworkEnvVars: TerraformVars = {
  celo_env: envVar.CELOTOOL_CELOENV,
  gcloud_credentials_path: envVar.GOOGLE_APPLICATION_CREDENTIALS,
  gcloud_project: envVar.TESTNET_PROJECT_NAME,
}

export async function deploy(celoEnv: string, onConfirmFailed?: () => Promise<void>) {
  // If we are not using the default network, we want to create/upgrade our network
  if (!useDefaultNetwork()) {
    console.info('First deploying the testnet VPC network')

    const networkVars: TerraformVars = getTestnetNetworkVars(celoEnv)
    await deployModule(celoEnv, testnetNetworkTerraformModule, networkVars, onConfirmFailed)
  }

  const testnetVars: TerraformVars = getTestnetVars(celoEnv)
  await deployModule(celoEnv, testnetTerraformModule, testnetVars, onConfirmFailed, async () => {
    console.info('Generating and uploading secrets env files to Google Storage...')
    await generateAndUploadSecrets(celoEnv)
  })

  await uploadGenesisBlockToGoogleStorage(celoEnv)
  await uploadEnvFileToGoogleStorage(celoEnv)
}

async function deployModule(
  celoEnv: string,
  terraformModule: string,
  vars: TerraformVars,
  onConfirmFailed?: () => Promise<void>,
  onConfirmSuccess?: () => Promise<void>
) {
  const backendConfigVars: TerraformVars = getTerraformBackendConfigVars(celoEnv, terraformModule)

  const envType = fetchEnv(envVar.ENV_TYPE)
  console.info(`
    Deploying:
    Terraform Module: ${terraformModule}
    Celo Env: ${celoEnv}
    Environment: ${envType}
  `)

  console.info('Initializing...')
  await initTerraformModule(terraformModule, vars, backendConfigVars)

  console.info('Planning...')
  await planTerraformModule(terraformModule, vars)

  await confirmAction(
    `Are you sure you want to perform the above plan for Celo env ${celoEnv} in environment ${envType}?`,
    onConfirmFailed,
    onConfirmSuccess
  )

  console.info('Applying...')
  await applyTerraformModule(terraformModule)
}

export async function destroy(celoEnv: string) {
  const testnetVars: TerraformVars = getTestnetVars(celoEnv)

  await destroyModule(celoEnv, testnetTerraformModule, testnetVars)

  // If we are not using the default network, we want to destroy our network
  if (!useDefaultNetwork()) {
    console.info('Destroying the testnet VPC network')

    const networkVars: TerraformVars = getTestnetNetworkVars(celoEnv)
    await destroyModule(celoEnv, testnetNetworkTerraformModule, networkVars)
  }
}

async function destroyModule(celoEnv: string, terraformModule: string, vars: TerraformVars = {}) {
  const backendConfigVars: TerraformVars = getTerraformBackendConfigVars(celoEnv, terraformModule)

  const envType = fetchEnv(envVar.ENV_TYPE)
  console.info(`
    Destroying:
    Terraform Module: ${terraformModule}
    Celo Env: ${celoEnv}
    Environment: ${envType}
  `)

  console.info('Initializing...')
  await initTerraformModule(terraformModule, vars, backendConfigVars)

  console.info('Planning...')
  await planTerraformModule(terraformModule, vars, true)

  await confirmAction(`Are you sure you want to destroy ${celoEnv} in environment ${envType}?`)

  await destroyTerraformModule(terraformModule, vars)
}

// force the recreation of various resources upon the next deployment
export async function taintTestnet(celoEnv: string) {
  console.info('Tainting testnet...')
  const vars: TerraformVars = getTestnetVars(celoEnv)
  const backendConfigVars: TerraformVars = getTerraformBackendConfigVars(
    celoEnv,
    testnetTerraformModule
  )
  await initTerraformModule(testnetTerraformModule, vars, backendConfigVars)

  // bootnode
  console.info('Tainting bootnode...')
  await taintTerraformModuleResource(
    testnetTerraformModule,
    `module.bootnode.google_compute_instance.bootnode`
  )
  // validators
  console.info('Tainting validators...')
  await taintEveryResourceWithPrefix(
    testnetTerraformModule,
    `module.validator.google_compute_instance.validator`
  )
  // validator disks
  console.info('Tainting validator disks...')
  await taintEveryResourceWithPrefix(
    testnetTerraformModule,
    `module.validator.google_compute_disk.validator`
  )
  // tx-nodes
  console.info('Tainting tx-nodes...')
  await taintEveryResourceWithPrefix(
    testnetTerraformModule,
    `module.tx_node.google_compute_instance.tx_node`
  )
}

export async function untaintTestnet(celoEnv: string) {
  console.info('Untainting testnet...')
  const vars: TerraformVars = getTestnetVars(celoEnv)
  const backendConfigVars: TerraformVars = getTerraformBackendConfigVars(
    celoEnv,
    testnetTerraformModule
  )
  await initTerraformModule(testnetTerraformModule, vars, backendConfigVars)

  // bootnode
  console.info('Untainting bootnode...')
  await untaintTerraformModuleResource(
    testnetTerraformModule,
    `module.bootnode.google_compute_instance.bootnode`
  )
  // validators
  console.info('Untainting validators...')
  await untaintEveryResourceWithPrefix(
    testnetTerraformModule,
    `module.validator.google_compute_instance.validator`
  )
  // validator disks
  console.info('Untainting validator disks...')
  await untaintEveryResourceWithPrefix(
    testnetTerraformModule,
    `module.validator.google_compute_disk.validator`
  )
  // tx-nodes
  console.info('Untainting tx-nodes...')
  await untaintEveryResourceWithPrefix(
    testnetTerraformModule,
    `module.tx_node.google_compute_instance.tx_node`
  )
}

async function taintEveryResourceWithPrefix(moduleName: string, resourceName: string) {
  const matches = await getEveryResourceWithPrefix(moduleName, resourceName)
  for (const match of matches) {
    await taintTerraformModuleResource(moduleName, match)
  }
}

async function untaintEveryResourceWithPrefix(moduleName: string, resourceName: string) {
  const matches = await getEveryResourceWithPrefix(moduleName, resourceName)
  for (const match of matches) {
    await untaintTerraformModuleResource(moduleName, match)
  }
}

async function getEveryResourceWithPrefix(moduleName: string, resourcePrefix: string) {
  const resources = await getTerraformModuleResourceNames(moduleName)
  return resources.filter((resource: string) => resource.startsWith(resourcePrefix))
}

export async function getTestnetOutputs(celoEnv: string) {
  const vars: TerraformVars = getTestnetVars(celoEnv)
  const backendConfigVars: TerraformVars = getTerraformBackendConfigVars(
    celoEnv,
    testnetTerraformModule
  )

  return getTerraformModuleOutputs(testnetTerraformModule, vars, backendConfigVars)
}

function getTerraformBackendConfigVars(celoEnv: string, terraformModule: string) {
  return {
    prefix: `${celoEnv}/${terraformModule}`,
  }
}

function getTestnetVars(celoEnv: string) {
  const genesisBuffer = new Buffer(generateGenesisFromEnv())
  return {
    ...getEnvVarValues(testnetEnvVars),
    ethstats_host: `${celoEnv}-ethstats.${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}.org`,
    gcloud_secrets_bucket: secretsBucketName,
    gcloud_secrets_base_path: secretsBasePath(celoEnv),
    // only able to view objects (for accessing secrets)
    gcloud_vm_service_account_email: 'terraform-testnet@celo-testnet.iam.gserviceaccount.com',
    genesis_content_base64: genesisBuffer.toString('base64'),
    network_name: networkName(celoEnv),
  }
}

function getTestnetNetworkVars(celoEnv: string) {
  return {
    ...getEnvVarValues(testnetNetworkEnvVars),
    network_name: networkName(celoEnv),
  }
}

function getEnvVarValues(terraformEnvVars: TerraformVars) {
  const vars: { [key: string]: string } = {}
  for (const key of Object.keys(terraformEnvVars)) {
    vars[key] = fetchEnv(terraformEnvVars[key])
  }
  return vars
}

export async function generateAndUploadSecrets(celoEnv: string) {
  // Bootnode
  const bootnodeSecrets = generateBootnodeSecretEnvVars()
  await uploadSecrets(celoEnv, bootnodeSecrets, 'bootnode')
  // Tx Nodes
  const txNodeCount = parseInt(fetchEnv(envVar.TX_NODES), 10)
  for (let i = 0; i < txNodeCount; i++) {
    const secrets = generateValidatorSecretEnvVars(AccountType.TX_NODE, i)
    await uploadSecrets(celoEnv, secrets, `tx-node-${i}`)
  }
  // Validators
  const validatorCount = parseInt(fetchEnv(envVar.VALIDATORS), 10)
  for (let i = 0; i < validatorCount; i++) {
    const secrets = generateValidatorSecretEnvVars(AccountType.VALIDATOR, i)
    await uploadSecrets(celoEnv, secrets, `validator-${i}`)
  }
}

function uploadSecrets(celoEnv: string, secrets: string, resourceName: string) {
  const localTmpFilePath = `/tmp/${celoEnv}-${resourceName}-secrets`
  writeFileSync(localTmpFilePath, secrets)
  const cloudStorageFileName = `${secretsBasePath(celoEnv)}/.env.${resourceName}`
  return uploadFileToGoogleStorage(
    localTmpFilePath,
    secretsBucketName,
    cloudStorageFileName,
    false,
    'text/plain'
  )
}

function generateBootnodeSecretEnvVars() {
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  return formatEnvVars({
    NODE_KEY: generatePrivateKey(mnemonic, AccountType.LOAD_TESTING_ACCOUNT, 0),
  })
}

function generateValidatorSecretEnvVars(accountType: AccountType, index: number) {
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  const privateKey = generatePrivateKey(mnemonic, accountType, index)
  const secrets = {
    ACCOUNT_ADDRESS: privateKeyToAddress(privateKey),
    BOOTNODE_ENODE_ADDRESS: privateKeyToPublicKey(
      generatePrivateKey(mnemonic, AccountType.LOAD_TESTING_ACCOUNT, 0)
    ),
    PRIVATE_KEY: privateKey,
    [envVar.GETH_ACCOUNT_SECRET]: fetchEnv(envVar.GETH_ACCOUNT_SECRET),
    [envVar.ETHSTATS_WEBSOCKETSECRET]: fetchEnv(envVar.ETHSTATS_WEBSOCKETSECRET),
    [envVar.MNEMONIC]: mnemonic,
  }
  return formatEnvVars(secrets)
}

// Formats an object into a multi-line string with each line as KEY=VALUE
function formatEnvVars(envVars: { [key: string]: string | number | boolean }) {
  return Object.keys(envVars)
    .map((key) => `${key}='${envVars[key]}'`)
    .join('\n')
}

function secretsBasePath(celoEnv: string) {
  return `vm/${celoEnv}`
}

function useDefaultNetwork() {
  return (
    fetchEnvOrFallback(envVar.VM_BASED, 'false') !== 'true' ||
    fetchEnv(envVar.KUBERNETES_CLUSTER_NAME) === 'celo-networks-dev'
  )
}

export function networkName(celoEnv: string) {
  return useDefaultNetwork() ? 'default' : `${celoEnv}-network`
}
