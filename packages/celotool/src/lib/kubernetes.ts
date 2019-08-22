import { envVar, fetchEnv } from '@celo/celotool/src/lib/env-utils'
import { execCmdWithExitOnFailure } from '@celo/celotool/src/lib/utils'

const NUMBER_OF_TX_NODES = 4

export async function scaleResource(
  celoEnv: string,
  type: string,
  resourceName: string,
  replicaCount: number
) {
  await execCmdWithExitOnFailure(
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
  const txNodes = fetchEnv(envVar.TX_NODES)
  if (txNodes === 'og') {
    return getRandomOgTxNodeIP(celoEnv)
  } else {
    return getRandomStatefulSetTxNodeIp(celoEnv)
  }
}

async function getRandomStatefulSetTxNodeIp(celoEnv: string) {
  const txNodes = parseInt(fetchEnv(envVar.TX_NODES), 10)
  const randomNumber = Math.floor(Math.random() * txNodes)
  const [address] = await execCmdWithExitOnFailure(
    `kubectl get service/${celoEnv}-service-${randomNumber} --namespace ${celoEnv} -o jsonpath='{.status.loadBalancer.ingress[0].ip}'`
  )
  return address
}

async function getRandomOgTxNodeIP(celoEnv: string) {
  const randomNumber = Math.floor(Math.random() * NUMBER_OF_TX_NODES) + 1
  const [rawTxOutput] = await execCmdWithExitOnFailure(
    `kubectl get svc ${celoEnv}-gethtx${randomNumber} -o json --namespace ${celoEnv}`
  )

  const txNodeData = JSON.parse(rawTxOutput)

  if (txNodeData.status.loadBalancer.ingress === undefined) {
    console.error(
      `Transaction node ${celoEnv}-gethtx${randomNumber} does not have a loadBalancer IP`
    )
    process.exit(1)
  }

  return txNodeData.status.loadBalancer.ingress[0].ip
}
