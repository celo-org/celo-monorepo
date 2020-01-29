import { envVar, fetchEnv } from './env-utils'
import { execCmd, execCmdWithExitOnFailure } from './utils'

export async function scaleResource(
  celoEnv: string,
  type: string,
  resourceName: string,
  replicaCount: number,
  allowFail: boolean = false
) {
  const execFn = allowFail ? execCmd : execCmdWithExitOnFailure
  await execFn(
    `kubectl scale ${type} ${resourceName} --replicas=${replicaCount} --namespace ${celoEnv}`
  )
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
