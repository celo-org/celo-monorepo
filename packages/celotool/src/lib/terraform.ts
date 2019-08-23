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

// pulls remote state
function refreshTerraformModule(moduleName: string, vars: TerraformVars) {
  return execTerraformCmd('refresh', getModulePath(moduleName), getVarOptions(vars))
}

export async function getTerraformModuleOutputs(
  moduleName: string,
  vars: TerraformVars,
  backendConfigVars: TerraformVars
) {
  await initTerraformModule(moduleName, vars, backendConfigVars)
  await refreshTerraformModule(moduleName, vars)
  const modulePath = getModulePath(moduleName)
  const [output] = await execCmd(`cd ${modulePath} && terraform output -json`)
  return JSON.parse(output)
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

function buildTerraformCmd(command: string, cmdPath: string, ...options: string[]) {
  const optionsStr = options ? options.join(' ') : ''
  return `terraform ${command} -input=false ${optionsStr} ${cmdPath}`
}
