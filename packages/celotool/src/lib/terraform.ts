import fs from 'fs'
import path from 'path'

import { generateGenesisFromEnv } from '@celo/celotool/src/lib/generate_utils'
import { envVar, execCmd, fetchEnv } from '@celo/celotool/src/lib/utils'

const terraformModulesPath = path.join(__dirname, '../../../terraform-modules')

// NOTE(trevor): The keys correspond to the variable names that Terraform expects
// and the values correspond to the names of the appropriate env variables
const terraformEnvVars: { [varName: string]: string } = {
  block_time: envVar.BLOCK_TIME,
  celo_env: envVar.CELOTOOL_CELOENV,
  celotool_docker_image_repository: envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY,
  celotool_docker_image_tag: envVar.CELOTOOL_DOCKER_IMAGE_TAG,
  geth_verbosity: envVar.GETH_VERBOSITY,
  geth_bootnode_docker_image_repository: envVar.GETH_BOOTNODE_DOCKER_IMAGE_REPOSITORY,
  geth_bootnode_docker_image_tag: envVar.GETH_BOOTNODE_DOCKER_IMAGE_TAG,
  geth_node_docker_image_repository: envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY,
  geth_node_docker_image_tag: envVar.GETH_NODE_DOCKER_IMAGE_TAG,
  mnemonic: envVar.MNEMONIC,
  network_id: envVar.NETWORK_ID,
  validator_count: envVar.VALIDATORS,
  validator_geth_account_secret: envVar.GETH_ACCOUNT_SECRET,
  verification_pool_url: envVar.VERIFICATION_POOL_URL,
}

export function initTerraformModule(moduleName: string) {
  return execTerraformCmd('init', getModulePath(moduleName), getEnvVarOptions())
}

export function planTerraformModule(moduleName: string, destroy: boolean = false) {
  const planPath = getPlanPath(moduleName)
  // Terraform requires an out directory to exist
  const planDir = path.dirname(planPath)
  if (!fs.existsSync(planDir)) {
    fs.mkdirSync(planDir)
  }
  return execTerraformCmd(
    'plan',
    getModulePath(moduleName),
    `-out=${planPath}`,
    getVarOptions(),
    destroy ? '-destroy' : ''
  )
}

export function applyTerraformModule(moduleName: string) {
  return execTerraformCmd('apply', getPlanPath(moduleName))
}

export function destroyTerraformModule(moduleName: string) {
  return execTerraformCmd('destroy', getModulePath(moduleName), getVarOptions(), '-force')
}

function getModulePath(moduleName: string) {
  return path.join(terraformModulesPath, moduleName)
}

function getPlanPath(moduleName: string) {
  return path.join(terraformModulesPath, 'plan', moduleName)
}

function getVarOptions() {
  const genesisBuffer = new Buffer(generateGenesisFromEnv())
  return [
    getEnvVarOptions(),
    `-var='genesis_content_base64=${genesisBuffer.toString('base64')}'`,
  ].join(' ')
}

// Uses the `terraformEnvVars` mapping to create terraform cli options
// for each variable using values from env vars
function getEnvVarOptions() {
  const nameValuePairs = Object.keys(terraformEnvVars).map(
    (varName) => `-var='${varName}=${fetchEnv(terraformEnvVars[varName])}'`
  )
  return nameValuePairs.join(' ')
}

function execTerraformCmd(command: string, workspacePath: string, ...options: string[]) {
  const optionsStr = options ? options.join(' ') : ''
  const cmd = `terraform ${command} -input=false ${optionsStr} ${workspacePath}`
  // use the middle two default arguments
  return execCmd(cmd, {}, false, true)
}
