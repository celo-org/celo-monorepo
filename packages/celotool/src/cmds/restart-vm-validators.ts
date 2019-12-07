import { addCeloEnvMiddleware, CeloEnvArgv, envVar, fetchEnv } from 'src/lib/env-utils'
import { execCmd } from 'src/lib/utils'
import { getSshCommand } from './ssh-vm-node'

export const command = 'reset-vm-validators'

export const describe = 'Restarts the geth Docker container for all validators in an env'

export const builder = addCeloEnvMiddleware

export const handler = async (argv: CeloEnvArgv) => {
  const project = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  const zone = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)

  const validatorCount = parseInt(fetchEnv(envVar.VALIDATORS), 10)

  console.info(
    `Restarting all validators.\nEnv: ${
      argv.celoEnv
    }\nProject: ${project}\nZone: ${zone}\nValidator Count: ${validatorCount}`
  )

  const restartCmd = 'sudo docker restart geth'

  const runCmds = []

  for (let i = 0; i < validatorCount; i++) {
    const validatorInstanceName = `${argv.celoEnv}-validator-${i}`
    console.info(`Getting promise for ${validatorInstanceName}`)
    runCmds.push(runSshCommand(project, zone, validatorInstanceName, restartCmd))
  }

  await Promise.all(runCmds)

  console.info('All validators have been reset.')
}

async function runSshCommand(
  gcloudProject: string,
  gcloudZone: string,
  instanceName: string,
  cmd: string
) {
  const bareSshCmd = getSshCommand(gcloudProject, gcloudZone, instanceName)
  const fullCmd = `${bareSshCmd} --command "${cmd}"`
  console.info(`Running ${fullCmd}`)
  return execCmd(fullCmd, {}, false, true)
}
