import { addCeloEnvMiddleware, CeloEnvArgv, envVar, fetchEnv } from 'src/lib/env-utils'
import { execCmd } from 'src/lib/utils'
import yargs from 'yargs'

export const command = 'ssh-vm-node <nodeType> [nodeIndex]'

export const describe =
  'Generates a command to ssh into a vm-testnet node. To execute the ssh command, run `eval $(<this cmd>)`'

interface SshVmNodeArgv extends CeloEnvArgv {
  nodeType: 'validator' | 'tx-node' | 'bootnode' | 'proxy'
  nodeIndex?: number
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .positional('nodeType', {
      describe: 'Type of node',
      choices: ['validator', 'tx-node', 'bootnode', 'proxy'],
      type: 'string',
    })
    .positional('nodeIndex', {
      describe: 'Index of the node. Only needed for validator or tx-node',
      type: 'number',
    })
    .check((checkArgv: SshVmNodeArgv) => {
      const requiresIndex = checkArgv.nodeType === 'validator' || checkArgv.nodeType === 'tx-node'
      if (requiresIndex && checkArgv.nodeIndex === undefined) {
        return new Error(`nodeIndex is required for nodeType ${checkArgv.nodeType}`)
      }
      return true
    })
}

export const handler = async (argv: SshVmNodeArgv) => {
  const project = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  const zone = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)
  const nodeTypesWithRandomSuffixes = ['tx-node', 'proxy']

  let instanceName
  if (nodeTypesWithRandomSuffixes.includes(argv.nodeType)) {
    instanceName = await getNodeVmNameWithRandomSuffix(
      project,
      argv.celoEnv,
      argv.nodeType,
      argv.nodeIndex || 0
    )
  } else {
    instanceName = `${argv.celoEnv}-${argv.nodeType}`
    if (argv.nodeIndex !== undefined) {
      instanceName += `-${argv.nodeIndex}`
    }
  }

  console.info(getSshCommand(project, zone, instanceName))
}

export function getSshCommand(gcloudProject: string, gcloudZone: string, instanceName: string) {
  return `gcloud beta compute --project '${gcloudProject}' ssh --zone '${gcloudZone}' ${instanceName} --tunnel-through-iap`
}

// Some VM names have a randomly generated suffix. This returns the full name
// of the instance given only the celoEnv and index.
async function getNodeVmNameWithRandomSuffix(
  gcloudProject: string,
  celoEnv: string,
  nodeType: string,
  index: number
) {
  const [nodeName] = await execCmd(
    `gcloud compute instances list --project '${gcloudProject}' --filter="NAME ~ ${celoEnv}-${nodeType}-${index}-.*" --format get\\(NAME\\)`
  )
  return nodeName.trim()
}
