import { execCmd, execCmdWithExitOnFailure } from './cmd-utils'
import { envVar, fetchEnv } from './env-utils'

export async function scaleResource(
  celoEnv: string,
  type: string,
  resourceName: string,
  replicaCount: number,
  allowFail: boolean = false
) {
  const execFn = allowFail ? execCmd : execCmdWithExitOnFailure
  const run = () =>
    execFn(
      `kubectl scale ${type} ${resourceName} --replicas=${replicaCount} --namespace ${celoEnv}`
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

export async function getStatefulSetReplicas(celoEnv: string, resourceName: string) {
  const [replicas] = await execCmdWithExitOnFailure(
    `kubectl get statefulset ${resourceName} --namespace ${celoEnv} -o jsonpath={.status.replicas}`
  )
  return parseInt(replicas, 10)
}

export async function getRandomTxNodeIP(celoEnv: string) {
  const txNodes = parseInt(fetchEnv(envVar.TX_NODES), 10)
  const randomNumber = Math.floor(Math.random() * txNodes)
  const [address] = await execCmdWithExitOnFailure(
    `kubectl get service/${celoEnv}-service-${randomNumber} --namespace ${celoEnv} -o jsonpath='{.status.loadBalancer.ingress[0].ip}'`
  )
  return address
}

export async function deleteResource(
  celoEnv: string,
  type: string,
  resourceName: string,
  allowFail: boolean = false
) {
  const execFn = allowFail ? execCmd : execCmdWithExitOnFailure
  const run = () => execFn(`kubectl delete ${type} ${resourceName} --namespace ${celoEnv}`)
  if (allowFail) {
    try {
      return run()
    } catch (e) {
      console.info('Error deleting resource, not failing', e)
      return Promise.resolve()
    }
  }
  return run()
}
