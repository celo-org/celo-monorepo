import fs from 'fs'
import path from 'path'
import { execCmd } from './cmd-utils'

const terraformModulesPath = path.join(__dirname, '../../../terraform-modules')

export interface TerraformVars {
  [key: string]: string
}

// Terraform requires the `backend-config` options to configure a remote backend
// with dynamic values. Sends stdout to /dev/null.
export async function initTerraformModule(
  moduleName: string,
  vars: TerraformVars,
  backendConfigVars: TerraformVars
) {
  const modulePath = getModulePath(moduleName)
  return buildAndExecTerraformCmd(
    'init',
    modulePath,
    modulePath,
    getVarOptions(vars),
    getVarOptions(backendConfigVars, 'backend-config'),
    '-reconfigure',
    '> /dev/null'
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
  return buildAndExecTerraformCmd(
    'plan',
    modulePath,
    modulePath,
    `-out=${planPath}`,
    getVarOptions(vars),
    destroy ? '-destroy' : ''
  )
}

export function applyTerraformModule(moduleName: string) {
  return buildAndExecTerraformCmd('apply', getModulePath(moduleName), getPlanPath(moduleName))
}

export function destroyTerraformModule(moduleName: string, vars: TerraformVars) {
  return buildAndExecTerraformCmd(
    'destroy',
    getModulePath(moduleName),
    getVarOptions(vars),
    '-force'
  )
}

// Taints a resource or multiple resources with the same prefix if the resource name
// ends with '.*'
export function taintTerraformModuleResource(moduleName: string, resourceName: string) {
  if (resourceName.endsWith('.*')) {
    return taintEveryResourceWithPrefix(moduleName, resourceName.replace('.*', ''))
  } else {
    return taintResource(moduleName, resourceName)
  }
}

// Untaints a resource or multiple resources with the same prefix if the resource name
// ends with '.*'
export function untaintTerraformModuleResource(moduleName: string, resourceName: string) {
  if (resourceName.endsWith('.*')) {
    return untaintEveryResourceWithPrefix(moduleName, resourceName.replace('.*', ''))
  } else {
    return untaintResource(moduleName, resourceName)
  }
}

async function taintEveryResourceWithPrefix(moduleName: string, resourceName: string) {
  const matches = await getEveryResourceWithPrefix(moduleName, resourceName)
  for (const match of matches) {
    await taintResource(moduleName, match)
  }
}

async function untaintEveryResourceWithPrefix(moduleName: string, resourceName: string) {
  const matches = await getEveryResourceWithPrefix(moduleName, resourceName)
  for (const match of matches) {
    await untaintResource(moduleName, match)
  }
}

async function getEveryResourceWithPrefix(moduleName: string, resourcePrefix: string) {
  const resources = await getTerraformModuleResourceNames(moduleName)
  return resources.filter((resource: string) => resource.startsWith(resourcePrefix))
}

// Allow failures
function taintResource(moduleName: string, resourceName: string) {
  try {
    return execTerraformCmd(`terraform taint ${resourceName}`, getModulePath(moduleName), false)
  } catch (e) {
    console.info(`Could not taint ${resourceName}`, e)
    return Promise.resolve()
  }
}

// Allow failures
function untaintResource(moduleName: string, resourceName: string) {
  try {
    return execTerraformCmd(`terraform untaint ${resourceName}`, getModulePath(moduleName), false)
  } catch (e) {
    console.info(`Could not taint ${resourceName}`, e)
    return Promise.resolve()
  }
}

// pulls remote state
function refreshTerraformModule(moduleName: string, vars: TerraformVars) {
  return buildAndExecTerraformCmd('refresh', getModulePath(moduleName), getVarOptions(vars))
}

export async function getTerraformModuleOutputs(moduleName: string, vars: TerraformVars) {
  await refreshTerraformModule(moduleName, vars)
  const modulePath = getModulePath(moduleName)
  const [output] = await execCmd(`cd ${modulePath} && terraform output -json`)
  return JSON.parse(output)
}

// returns an array of resource and data names in the current state
export async function getTerraformModuleResourceNames(moduleName: string) {
  const [output] = await execTerraformCmd(`terraform state list`, getModulePath(moduleName), false)
  return output.split('\n')
}

export function showTerraformModulePlan(moduleName: string) {
  return execTerraformCmd(
    `terraform show ${getPlanPath(moduleName)}`,
    getModulePath(moduleName),
    true
  )
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

function execTerraformCmd(command: string, modulePath: string, pipeOutput: boolean) {
  // use the middle two default arguments
  return execCmd(`cd ${modulePath} && ${command}`, {}, false, pipeOutput)
}

// `modulePath` is the path to the module that will be cd'd into. We change
// directories for each module so that module-specific configurations
// that are stored in the local .terraform directories do not conflict.
// `cmdPath` is the path to be provided to the terraform command
function buildAndExecTerraformCmd(
  commandName: string,
  modulePath: string,
  cmdPath: string,
  ...options: string[]
) {
  const terraformCmd = buildTerraformCmd(commandName, cmdPath, ...options)
  return execTerraformCmd(terraformCmd, modulePath, true)
}

function buildTerraformCmd(command: string, cmdPath: string, ...options: string[]) {
  const optionsStr = options ? options.join(' ') : ''
  return `terraform ${command} -input=false ${optionsStr} ${cmdPath}`
}
