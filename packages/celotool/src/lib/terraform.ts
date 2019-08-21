import { execCmd } from '@celo/celotool/src/lib/utils'
import fs from 'fs'
import path from 'path'

const terraformModulesPath = path.join(__dirname, '../../../terraform-modules')

export interface TerraformVars {
  [key: string]: string
}

// Terraform requires the `backend-config` options to configure a remote backend
// with dynamic values
export async function initTerraformModule(
  moduleName: string,
  vars: TerraformVars,
  backendConfigVars: TerraformVars
) {
  console.info('Resetting local state to force pull remote backend...')
  await resetLocalTerraformState()
  const modulePath = getModulePath(moduleName)
  return execTerraformCmd(
    'init',
    modulePath,
    modulePath,
    getVarOptions(vars),
    getVarOptions(backendConfigVars, 'backend-config')
  )
}

export function planTerraformModule(
  moduleName: string,
  vars: TerraformVars,
  destroy: boolean = false
) {
  const planPath = getPlanPath(moduleName)
  // Terraform requires an out directory to exist
  const planDir = path.dirname(planPath)
  if (!fs.existsSync(planDir)) {
    fs.mkdirSync(planDir)
  }
  const modulePath = getModulePath(moduleName)
  return execTerraformCmd(
    'plan',
    modulePath,
    modulePath,
    `-out=${planPath}`,
    getVarOptions(vars),
    destroy ? '-destroy' : ''
  )
}

export function applyTerraformModule(moduleName: string) {
  return execTerraformCmd('apply', getModulePath(moduleName), getPlanPath(moduleName))
}

export function destroyTerraformModule(moduleName: string, vars: TerraformVars) {
  return execTerraformCmd('destroy', getModulePath(moduleName), getVarOptions(vars), '-force')
}

// This is a workaround to `terraform output` requiring users to run it from
// inside the Terraform module directory. See:
// https://github.com/hashicorp/terraform/issues/15581
// https://github.com/hashicorp/terraform/issues/17300
export async function getTerraformModuleOutputs(
  moduleName: string,
  vars: TerraformVars,
  backendConfigVars: TerraformVars
) {
  // console.info('Resetting local state to force pull remote backend...')
  // await resetLocalTerraformState()

  const initCmd = buildTerraformCmd(
    'init',
    getModulePath(moduleName),
    getVarOptions(vars),
    getVarOptions(backendConfigVars, 'backend-config')
  )

  const refreshCmd = buildTerraformCmd('refresh', getModulePath(moduleName), getVarOptions(vars))
  const [stdout] = await execCmd(`
    cd ${getModulePath(moduleName)} && \
    ${initCmd} > /dev/null 2>&1 && \
    ${refreshCmd} > /dev/null 2>&1 && \
    terraform output -json
  `)
  console.log(stdout)
  return JSON.parse(stdout)
}

function resetLocalTerraformState() {
  // return execCmd('rm -f ./.terraform/terraform.tfstate')
}

function getModulePath(moduleName: string) {
  return path.join(terraformModulesPath, moduleName)
}

function getPlanPath(moduleName: string) {
  return path.join(terraformModulesPath, 'plan', moduleName)
}

// Uses a TerraformVars object to generate command line var options for Terraform
function getVarOptions(vars: TerraformVars, optionName: string = 'var') {
  const nameValuePairs = Object.keys(vars).map(
    (varName) => `-${optionName}='${varName}=${vars[varName]}'`
  )
  return nameValuePairs.join(' ')
}

// `modulePath` is the path to the module that will be cd'd into. We change
// directories for each module so that module-specific configurations
// that are stored in the local .terraform directories do not conflict.
// `cmdPath` is the path to be provided to the terraform command
function execTerraformCmd(
  command: string,
  modulePath: string,
  cmdPath: string,
  ...options: string[]
) {
  const terraformCmd = buildTerraformCmd(command, cmdPath, ...options)
  // use the middle two default arguments
  return execCmd(`cd ${modulePath} && ${terraformCmd}`, {}, false, true)
}

function buildTerraformCmd(command: string, actionPath: string, ...options: string[]) {
  const optionsStr = options ? options.join(' ') : ''
  return `terraform ${command} -input=false ${optionsStr} ${actionPath}`
}
