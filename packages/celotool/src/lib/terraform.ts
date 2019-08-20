import { execCmd } from '@celo/celotool/src/lib/utils'
import fs from 'fs'
import path from 'path'

const terraformModulesPath = path.join(__dirname, '../../../terraform-modules')

export interface TerraformVars {
  [key: string]: string
}

// Terraform requires the `backend-config` options to configure a remote backend
// with dynamic values
export function initTerraformModule(
  moduleName: string,
  vars: TerraformVars,
  backendConfigVars: TerraformVars
) {
  return execTerraformCmd(
    'init',
    getModulePath(moduleName),
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
  return execTerraformCmd(
    'plan',
    getModulePath(moduleName),
    `-out=${planPath}`,
    getVarOptions(vars),
    destroy ? '-destroy' : ''
  )
}

export function applyTerraformModule(moduleName: string) {
  return execTerraformCmd('apply', getPlanPath(moduleName))
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
  return JSON.parse(stdout)
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

function execTerraformCmd(command: string, workspacePath: string, ...options: string[]) {
  const cmd = buildTerraformCmd(command, workspacePath, ...options)
  // use the middle two default arguments
  return execCmd(cmd, {}, false, true)
}

function buildTerraformCmd(command: string, workspacePath: string, ...options: string[]) {
  const optionsStr = options ? options.join(' ') : ''
  return `terraform ${command} -input=false ${optionsStr} ${workspacePath}`
}
