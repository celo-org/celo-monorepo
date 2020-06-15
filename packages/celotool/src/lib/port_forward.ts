/* tslint:disable: no-console */
import { ChildProcess, spawnSync } from 'child_process'
import { execBackgroundCmd, execCmd } from './cmd-utils'
import { envVar, fetchEnv, isVmBased } from './env-utils'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const defaultPortsString = '8545:8545 8546:8546 9200:9200'

const PORT_CONTROL_CMD = 'nc -z 127.0.0.1 8545'
const DEFAULT_COMPONENT = 'validators'

async function getPortForwardCmd(celoEnv: string, component?: string, ports = defaultPortsString) {
  if (isVmBased()) {
    return Promise.resolve(getVmPortForwardCmd(celoEnv, component, ports))
  } else {
    return getKubernetesPortForwardCmd(celoEnv, component, ports)
  }
}

function getVmPortForwardCmd(celoEnv: string, machine = 'validator-0', ports = defaultPortsString) {
  const zone = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)
  // this command expects port mappings to be of the form `[localPort]:localhost:[remotePort]`
  const portMappings = ports.replace(/:/g, ':localhost:').split(' ')
  const portsWithFlags = portMappings.map((mapping) => `-L ${mapping}`).join(' ')
  return `gcloud compute ssh --zone ${zone} ${celoEnv}-${machine} -- -N ${portsWithFlags}`
}

async function getKubernetesPortForwardCmd(
  celoEnv: string,
  component?: string,
  ports = defaultPortsString
) {
  if (!component) {
    component = DEFAULT_COMPONENT
  }
  console.log(`Port-forwarding to ${celoEnv} ${component} ${ports}`)
  const portForwardArgs = await getPortForwardArgs(celoEnv, component, ports)
  return `kubectl ${portForwardArgs.join(' ')}`
}

async function getPortForwardArgs(celoEnv: string, component?: string, ports = defaultPortsString) {
  if (!component) {
    component = DEFAULT_COMPONENT
  }
  console.log(`Port-forwarding to ${celoEnv} ${component} ${ports}`)
  // The testnet helm chart used to have the label app=ethereum, but this was changed
  // to app=testnet. To preserve backward compatibility, we search for both labels.
  // It's not expected to ever have a situation where a namespace has pods with
  // both labels.
  const podName = await execCmd(
    `kubectl get pods --namespace ${celoEnv} -l "app in (ethereum,testnet), component=${component}, release=${celoEnv}" --field-selector=status.phase=Running -o jsonpath="{.items[0].metadata.name}"`
  )
  return ['port-forward', `--namespace=${celoEnv}`, podName[0], ...ports.split(' ')]
}

export async function portForward(celoEnv: string, component?: string, ports?: string) {
  try {
    const portForwardCmd = await getPortForwardCmd(celoEnv, component, ports)
    const splitCmd = portForwardCmd.split(' ')
    console.log(`Port-forwarding to celoEnv ${celoEnv} ports ${ports}`)
    console.log(`\t$ ${portForwardCmd}`)
    await spawnSync(splitCmd[0], splitCmd.slice(1), {
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
    childProcess = execBackgroundCmd(await getPortForwardCmd(celoEnv, component, ports))
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
