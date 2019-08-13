import {
  AccountType,
  generateGenesisFromEnv,
  generatePrivateKey,
  privateKeyToAddress,
  privateKeyToPublicKey,
} from '@celo/celotool/src/lib/generate_utils'
import {
  applyTerraformModule,
  destroyTerraformModule,
  initTerraformModule,
  planTerraformModule,
  TerraformVars,
} from '@celo/celotool/src/lib/terraform'
import {
  uploadFileToGoogleStorage,
  uploadGenesisBlockToGoogleStorage,
} from '@celo/celotool/src/lib/testnet-utils'
import { confirmAction, envVar, fetchEnv } from '@celo/celotool/src/lib/utils'
import { writeFileSync } from 'fs'

const secretsBucketName = 'celo-testnet-secrets'
const terraformModule = 'testnet'

// NOTE(trevor): The keys correspond to the variable names that Terraform expects
// and the values correspond to the names of the appropriate env variables
const terraformEnvVars: { [varName: string]: string } = {
  block_time: envVar.BLOCK_TIME,
  celo_env: envVar.CELOTOOL_CELOENV,
  geth_verbosity: envVar.GETH_VERBOSITY,
  geth_bootnode_docker_image_repository: envVar.GETH_BOOTNODE_DOCKER_IMAGE_REPOSITORY,
  geth_bootnode_docker_image_tag: envVar.GETH_BOOTNODE_DOCKER_IMAGE_TAG,
  geth_node_docker_image_repository: envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY,
  geth_node_docker_image_tag: envVar.GETH_NODE_DOCKER_IMAGE_TAG,
  network_id: envVar.NETWORK_ID,
  validator_count: envVar.VALIDATORS,
  verification_pool_url: envVar.VERIFICATION_POOL_URL,
}

export async function deploy(celoEnv: string) {
  const envType = fetchEnv(envVar.ENV_TYPE)
  console.info(`Deploying ${celoEnv} in environment ${envType}`)

  const vars: TerraformVars = getTerraformVars(celoEnv)

  console.info('Initializing...')
  await initTerraformModule(terraformModule, vars)

  console.info('Planning...')
  await planTerraformModule(terraformModule, vars)

  await confirmAction(
    `Are you sure you want to perform the above plan for Celo env ${celoEnv} in environment ${envType}?`
  )

  console.info('Generating and uploading secrets env files to Google Storage...')
  await generateAndUploadSecrets(celoEnv)

  console.info('Applying...')
  await applyTerraformModule(terraformModule)

  await uploadGenesisBlockToGoogleStorage(celoEnv)
}

export async function destroy(celoEnv: string) {
  const envType = fetchEnv(envVar.ENV_TYPE)
  console.info(`Destroying ${celoEnv} in environment ${envType}`)

  const vars: TerraformVars = getTerraformVars(celoEnv)

  console.info('Initializing...')
  await initTerraformModule(terraformModule, vars)

  console.info('Planning...')
  await planTerraformModule(terraformModule, vars, true)

  await confirmAction(`Are you sure you want to destroy ${celoEnv} in environment ${envType}?`)

  await destroyTerraformModule(terraformModule, vars)
}

function getTerraformVars(celoEnv: string) {
  const genesisBuffer = new Buffer(generateGenesisFromEnv())
  return {
    ...getTerraformEnvVarValues(),
    gcloud_secrets_bucket: secretsBucketName,
    gcloud_secrets_base_path: secretsBasePath(celoEnv),
    genesis_content_base64: genesisBuffer.toString('base64'),
  }
}

function getTerraformEnvVarValues() {
  const vars: { [key: string]: string } = {}
  for (const key of Object.keys(terraformEnvVars)) {
    vars[key] = fetchEnv(terraformEnvVars[key])
  }
  return vars
}

// TODO(trevor): update this to include tx-nodes when they are added to
// the terraform module
export async function generateAndUploadSecrets(celoEnv: string) {
  // Bootnode
  const bootnodeSecrets = generateBootnodeSecretEnvVars()
  await uploadSecrets(celoEnv, bootnodeSecrets, 'bootnode')
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
  return uploadFileToGoogleStorage(localTmpFilePath, secretsBucketName, cloudStorageFileName, false)
}

function generateBootnodeSecretEnvVars() {
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  return formatEnvVars({
    NODE_KEY: generatePrivateKey(mnemonic, AccountType.BOOTNODE, 0),
  })
}

function generateValidatorSecretEnvVars(accountType: AccountType, index: number) {
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  const privateKey = generatePrivateKey(mnemonic, accountType, index)
  const secrets = {
    ACCOUNT_ADDRESS: privateKeyToAddress(privateKey),
    BOOTNODE_ENODE_ADDRESS: privateKeyToPublicKey(
      generatePrivateKey(mnemonic, AccountType.BOOTNODE, 0)
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
