import { addCeloEnvMiddleware, CeloEnvArgv, envVar, fetchEnv } from 'src/lib/env-utils'
import { execCmd } from 'src/lib/utils'
import yargs from 'yargs'
import { getSshCommand } from './ssh-vm-node'

export const command = 'validators-exec'

export const describe = 'SSH and exec commands on all validators in a VM-based env'

interface ValidatorsExecArgv extends CeloEnvArgv {
  docker: string
  cmd: string
  only: string
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .option('docker', {
      type: 'string',
      description: 'Operation to run on the docker container {start|stop|restart}',
      default: 'restart',
    })
    .option('cmd', {
      type: 'string',
      description: 'Arbitrary command to exec',
      default: null,
    })
    .option('only', {
      type: 'string',
      description: 'do it on one validator, not all',
      default: null,
    })
}
export const handler = async (argv: ValidatorsExecArgv) => {
  const project = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  const zone = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)

  const validatorCount = parseInt(fetchEnv(envVar.VALIDATORS), 10)

  const cmd = argv.cmd === null ? `sudo docker ${argv.docker} geth` : argv.cmd

  console.info(
    `Running on validators.\n` +
      `Cmd: ${cmd}\n` +
      `Env: ${argv.celoEnv}\n` +
      `Project: ${project}\n` +
      `Zone: ${zone}\n` +
      `Validator Count: ${validatorCount}`
  )

  const runCmds = []
  if (argv.only === null) {
    for (let i = 0; i < validatorCount; i++) {
      runCmds.push(runSshCommand(project, zone, `${argv.celoEnv}-validator-${i}`, cmd))
    }
  } else {
    runCmds.push(runSshCommand(project, zone, `${argv.celoEnv}-validator-${argv.only}`, cmd))
  }
  await Promise.all(runCmds)

  console.info('Done.')
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
