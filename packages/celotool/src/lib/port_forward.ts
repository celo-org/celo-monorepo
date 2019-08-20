/* tslint:disable: no-console */
import { envVar, execBackgroundCmd, execCmd, fetchEnv } from '@celo/celotool/src/lib/utils'
import { ChildProcess, spawnSync } from 'child_process'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const defaultPortsString = '8545:8545 8546:8546 9200:9200'

const PORT_CONTROL_CMD = 'nc -z 127.0.0.1 8545'

function getDefaultComponent() {
  if (fetchEnv(envVar.VALIDATORS) === 'og') {
    return 'gethminer1'
  } else {
    return 'validators'
  }
}

function getPortForwardCmd(celoEnv: string, component?: string, ports = defaultPortsString) {
  if (!component) {
    component = getDefaultComponent()
  }
  console.log(`Port-forwarding to ${celoEnv} ${component} ${ports}`)
  return `kubectl port-forward --namespace ${celoEnv} $(kubectl get pods --namespace ${celoEnv} -l "app=ethereum, component=${component}, release=${celoEnv}" --field-selector=status.phase=Running -o jsonpath="{.items[0].metadata.name}") ${ports}`
}

async function getPortForwardArgs(celoEnv: string, component?: string, ports = defaultPortsString) {
  if (!component) {
    component = getDefaultComponent()
  }
  console.log(`Port-forwarding to ${celoEnv} ${component} ${ports}`)
  const podName = await execCmd(
    `kubectl get pods --namespace ${celoEnv} -l "app=ethereum, component=${component}, release=${celoEnv}" --field-selector=status.phase=Running -o jsonpath="{.items[0].metadata.name}"`
  )
  return ['port-forward', `--namespace=${celoEnv}`, podName[0], ...ports.split(' ')]
}

export async function portForward(celoEnv: string, component?: string, ports?: string) {
  try {
    await spawnSync('kubectl', await getPortForwardArgs(celoEnv, component, ports), {
      stdio: 'inherit',
    })
  } catch (error) {
    console.error(`Unable to port-forward to ${celoEnv}`)
    console.error(error)
    process.exit(1)
  }
}

export async function portForwardAnd(
  celoEnv: string,
  cb: () => void,
  component?: string,
  ports?: string
) {
  let childProcess: ChildProcess

  try {
    childProcess = execBackgroundCmd(getPortForwardCmd(celoEnv, component, ports))
  } catch (error) {
    console.error(error)
    process.exit(1)
    throw new Error() // unreachable, but to fix typescript
  }

  try {
    let isConnected = false
    while (!isConnected) {
      if (process.env.CELOTOOL_VERBOSE === 'true') {
        console.debug('Port Forward not ready yet...')
      }
      isConnected = await execCmd(PORT_CONTROL_CMD)
        .then(() => true)
        .catch(() => false)
      await sleep(2000)
    }
    await cb()
    childProcess.kill('SIGINT')
  } catch (error) {
    childProcess.kill('SIGINT')

    console.error(error)
    process.exit(1)
  }
}
