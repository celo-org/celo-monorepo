import { execCmd, execCmdWithExitOnFailure } from './cmd-utils'
import { envVar, fetchEnv } from './env-utils'

export async function scaleResource(
  namespace: string,
  type: string,
  resourceName: string,
  replicaCount: number,
  allowFail: boolean = false
) {
  const execFn = allowFail ? execCmd : execCmdWithExitOnFailure
  const run = () =>
    execFn(
      `kubectl scale ${type} ${resourceName} --replicas=${replicaCount} --namespace ${namespace}`
    )
  if (allowFail) {
    try {
      return run()
    } catch (e) {
      console.info('Error scaling resource, not failing', e)
      return Promise.resolve()
    }
  }
  return run()
}

export async function getStatefulSetReplicas(namespace: string, resourceName: string) {
  const [replicas] = await execCmd(
    `kubectl get statefulset ${resourceName} --namespace ${namespace} -o jsonpath={.status.replicas}`
  )
  return parseInt(replicas, 10)
}

export async function getRandomTxNodeIP(namespace: string) {
  const txNodes = parseInt(fetchEnv(envVar.TX_NODES), 10)
  const randomNumber = Math.floor(Math.random() * txNodes)
  const [address] = await execCmdWithExitOnFailure(
    `kubectl get service/${namespace}-service-${randomNumber} --namespace ${namespace} -o jsonpath='{.status.loadBalancer.ingress[0].ip}'`
  )
  return address
}

export async function deleteResource(
  namespace: string,
  type: string,
  resourceName: string,
  allowFail: boolean = false
) {
  const execFn = allowFail ? execCmd : execCmdWithExitOnFailure
  const run = () => execFn(`kubectl delete ${type} ${resourceName} --namespace ${namespace}`)
  if (allowFail) {
    try {
      // By awaiting here, we ensure that a rejected promise gets caught
      return await run()
    } catch (e) {
      console.info('Error deleting resource, not failing', e)
      return Promise.resolve()
    }
  }
  return run()
}

/**
 * Returns a sorted array of used node ports
 */
export async function getAllUsedNodePorts(
  namespace?: string,
  cmdFlags?: { [key: string]: string }
) {
  const namespaceFlag = namespace ? `--namespace ${namespace}` : `--all-namespaces`
  const cmdFlagStrs = cmdFlags
    ? Object.entries(cmdFlags).map(([flag, value]) => `--${flag} ${value}`)
    : []
  const [output] = await execCmd(
    `kubectl get svc ${namespaceFlag} ${cmdFlagStrs.join(
      ' '
    )} -o go-template='{{range .items}}{{range .spec.ports}}{{if .nodePort}}{{.nodePort}}{{"\\n"}}{{end}}{{end}}{{end}}'`
  )
  const nodePorts = output
    .trim()
    .split('\n')
    .filter((portStr: string) => portStr.length)
    .map((portStr: string) => parseInt(portStr, 10))
  // Remove duplicates and sort low -> high
  return Array.from(new Set(nodePorts)).sort((a: number, b: number) => a - b)
}

export async function getService(serviceName: string, namespace: string) {
  try {
    const [output] = await execCmd(
      `kubectl get svc ${serviceName} --namespace ${namespace} -o json`
    )
    return JSON.parse(output)
  } catch (e) {
    return undefined
  }
}

export async function getServerVersion() {
  const [output] = await execCmd(`kubectl version -o json`)
  const jsonOutput = JSON.parse(output)
  const [minorNumberStr] = jsonOutput.serverVersion.minor.match(/^([0-9]+)/g)
  if (!minorNumberStr) {
    throw Error('Could not get minor version')
  }
  return {
    major: parseInt(jsonOutput.serverVersion.major, 10),
    minor: parseInt(minorNumberStr, 10),
  }
}
