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
  uploadStaticNodesToGoogleStorage,
} from './testnet-utils'
import { execCmd } from './utils'

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
  geth_exporter_docker_image_repository: envVar.GETH_EXPORTER_DOCKER_IMAGE_REPOSITORY,
  geth_exporter_docker_image_tag: envVar.GETH_EXPORTER_DOCKER_IMAGE_TAG,
  geth_node_docker_image_repository: envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY,
  geth_node_docker_image_tag: envVar.GETH_NODE_DOCKER_IMAGE_TAG,
  in_memory_discovery_table: envVar.IN_MEMORY_DISCOVERY_TABLE,
  istanbul_request_timeout_ms: envVar.ISTANBUL_REQUEST_TIMEOUT_MS,
  network_id: envVar.NETWORK_ID,
  tx_node_count: envVar.TX_NODES,
  validator_count: envVar.VALIDATORS,
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
  await uploadStaticNodesToGoogleStorage(celoEnv)
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

  // NOTE(trevor): this seems to cause terraform v0.12.16 to panic, commenting out for now
  // await showTerraformModulePlan(terraformModule)

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

  // NOTE(trevor): this seems to cause terraform v0.12.16 to panic, commenting out for now
  // await showTerraformModulePlan(terraformModule)

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
  // tx-node random id
  console.info('Tainting tx-node random ids...')
  await taintEveryResourceWithPrefix(testnetTerraformModule, `module.tx_node.random_id.tx_node`)
  // tx-node addresses
  console.info('Tainting tx-node addresses...')
  await taintEveryResourceWithPrefix(
    testnetTerraformModule,
    `module.tx_node.google_compute_address.tx_node`
  )
  // tx-nodes
  console.info('Tainting tx-nodes...')
  await taintEveryResourceWithPrefix(
    testnetTerraformModule,
    `module.tx_node.google_compute_instance.tx_node`
  )
  // tx-node internal instance group random id
  console.info('Tainting internal tx-node instance group random id...')
  await taintTerraformModuleResource(testnetTerraformModule, `module.tx_node_lb.random_id.internal`)
  // tx-node internal instance group
  console.info('Tainting internal tx-node instance group...')
  await taintTerraformModuleResource(
    testnetTerraformModule,
    `module.tx_node_lb.google_compute_instance_group.internal`
  )
  // tx-node external instance group random id
  console.info('Tainting external tx-node instance group random id...')
  await taintTerraformModuleResource(testnetTerraformModule, `module.tx_node_lb.random_id.external`)
  // tx-node external instance group
  console.info('Tainting external tx-node instance group...')
  await taintTerraformModuleResource(
    testnetTerraformModule,
    `module.tx_node_lb.google_compute_instance_group.external`
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
  // tx-node random id
  console.info('Untainting tx-node random ids...')
  await untaintEveryResourceWithPrefix(testnetTerraformModule, `module.tx_node.random_id.tx_node`)
  // tx-node addresses
  console.info('Untainting tx-node addresses...')
  await untaintEveryResourceWithPrefix(
    testnetTerraformModule,
    `module.tx_node.google_compute_address.tx_node`
  )
  // tx-nodes
  console.info('Untainting tx-nodes...')
  await untaintEveryResourceWithPrefix(
    testnetTerraformModule,
    `module.tx_node.google_compute_instance.tx_node`
  )
  // tx-node internal instance group random id
  console.info('Untainting internal tx-node instance group random id...')
  await untaintTerraformModuleResource(
    testnetTerraformModule,
    `module.tx_node_lb.random_id.internal`
  )
  // tx-node internal instance group
  console.info('Untainting internal tx-node instance group...')
  await untaintTerraformModuleResource(
    testnetTerraformModule,
    `module.tx_node_lb.google_compute_instance_group.internal`
  )
  // tx-node external instance group random id
  console.info('Untainting tx-node external instance group random id...')
  await untaintTerraformModuleResource(
    testnetTerraformModule,
    `module.tx_node_lb.random_id.external`
  )
  // tx-node external instance group
  console.info('Untainting external tx-node instance group...')
  await untaintTerraformModuleResource(
    testnetTerraformModule,
    `module.tx_node_lb.google_compute_instance_group.external`
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
  await initTerraformModule(testnetTerraformModule, vars, backendConfigVars)
  return getTerraformModuleOutputs(testnetTerraformModule, vars)
}

export async function getInternalTxNodeLoadBalancerIP(celoEnv: string) {
  const outputs = await getTestnetOutputs(celoEnv)
  return outputs.tx_node_lb_internal_ip_address.value
}

export async function getInternalValidatorIPs(celoEnv: string) {
  const outputs = await getTestnetOutputs(celoEnv)
  return outputs.validator_internal_ip_addresses.value
}

export async function getInternalTxNodeIPs(celoEnv: string) {
  const outputs = await getTestnetOutputs(celoEnv)
  return outputs.tx_node_internal_ip_addresses.value
}

function getTerraformBackendConfigVars(celoEnv: string, terraformModule: string) {
  return {
    prefix: `${celoEnv}/${terraformModule}`,
  }
}

function getTestnetVars(celoEnv: string) {
  const genesisBuffer = new Buffer(generateGenesisFromEnv())
  const domainName = fetchEnv(envVar.CLUSTER_DOMAIN_NAME)
  return {
    ...getEnvVarValues(testnetEnvVars),
    dns_zone_name: dnsZoneName(domainName),
    ethstats_host: `${celoEnv}-ethstats.${domainName}.org`,
    // forno is the name for our setup that has tx-nodes reachable via a domain name
    forno_host: `${celoEnv}-forno.${domainName}.org`,
    gcloud_secrets_bucket: secretsBucketName,
    gcloud_secrets_base_path: secretsBasePath(celoEnv),
    // only able to view objects for accessing secrets & modify ssl certs for forno setup
    gcloud_vm_service_account_email: 'terraform-testnet@celo-testnet.iam.gserviceaccount.com',
    genesis_content_base64: genesisBuffer.toString('base64'),
    letsencrypt_email: 'n@celo.org',
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

// name of the DNS zone in Google Cloud for a particular domain
function dnsZoneName(domain: string) {
  return `${domain}-org`
}

// Sets the forno ssl certificate to be the newest one that's from Let's Encrypt.
// A dummy SSL certificate is used inside the Terraform module, but we have an instance
// that requests and auto-renews SSL certificates. When updating, Terraform will spot that the
// dummy SSL certificate the module specifies is not being used, and will start
// using it again. We must therefore switch back to using the correct SSL certificate
export async function setFornoSSLCertificate() {
  console.info('Getting most recent SSL certificate...')
  // Get the newest SSL certificate
  const certName = await getNewestSSLCertificateName()
  if (!certName) {
    return
  }
  console.info(`Found SSL cert: ${certName}`)

  // Use the correct SSL certificate
  const targetHttpsProxyName = `${fetchEnv(envVar.CELOTOOL_CELOENV)}-tx-node-lb-external-http-proxy`
  console.info(
    `Setting ${certName} as SSL certificate for target https proxy ${targetHttpsProxyName}`
  )
  await execGcloudCmd(
    `gcloud compute target-https-proxies update ${targetHttpsProxyName} --ssl-certificates ${certName}`
  )
}

async function getNewestSSLCertificateName() {
  const certPrefix = `${fetchEnv(envVar.CELOTOOL_CELOENV)}-tx-node-lb-forno-cert`
  const [jsonOutput] = await execGcloudCmd(
    `gcloud compute ssl-certificates list --sort-by="~creation_timestamp" --filter="name ~ ^${certPrefix}" --format="json(name)" --limit 1`
  )
  const sslCert = JSON.parse(jsonOutput)
  if (!sslCert.length) {
    console.warn('No existing SSL certificates found')
    return null
  }
  return sslCert[0].name
}

function execGcloudCmd(cmd: string) {
  return execCmd(`${cmd} --project ${fetchEnv(envVar.TESTNET_PROJECT_NAME)}`)
}
