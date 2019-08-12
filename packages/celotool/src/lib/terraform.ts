import fs from 'fs'
import path from 'path'

import { generateGenesisFromEnv } from '@celo/celotool/src/lib/generate_utils'
import { envVar, execCmd, fetchEnv } from '@celo/celotool/src/lib/utils'

const terraformModulesPath = path.join(__dirname, '../../../terraform-modules')

export interface TerraformVars {
  [key: string]: string
}

export function initTerraformModule(moduleName: string, vars: TerraformVars) {
  return execTerraformCmd('init', getModulePath(moduleName), getVarOptions(vars))
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

function getModulePath(moduleName: string) {
  return path.join(terraformModulesPath, moduleName)
}

function getPlanPath(moduleName: string) {
  return path.join(terraformModulesPath, 'plan', moduleName)
}

// Uses a TerraformVars object to generate command line var options for Terraform
function getVarOptions(vars: TerraformVars) {
  const nameValuePairs = Object.keys(vars).map((varName) => `-var='${varName}=${vars[varName]}'`)
  return nameValuePairs.join(' ')
}

function execTerraformCmd(command: string, workspacePath: string, ...options: string[]) {
  const optionsStr = options ? options.join(' ') : ''
  const cmd = `terraform ${command} -input=false ${optionsStr} ${workspacePath}`
  // use the middle two default arguments
  return execCmd(cmd, {}, false, true)
}
