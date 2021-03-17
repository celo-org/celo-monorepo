import { makeHelmParameters } from 'src/lib/helm_deploy'
import { envVar, fetchEnv } from './env-utils'

export function helmReleaseName(celoEnv: string) {
  return celoEnv + '-wallet-connect'
}

export const helmChartDir = '../helm-charts/wallet-connect'

export function helmParameters() {
  return makeHelmParameters({
    'domain.name': fetchEnv(envVar.CLUSTER_DOMAIN_NAME),
    'walletconnect.image.repository': fetchEnv(envVar.WALLET_CONNECT_IMAGE_REPOSITORY),
    'walletconnect.image.tag': fetchEnv(envVar.WALLET_CONNECT_IMAGE_TAG),
    'redis.cluster.enabled': fetchEnv(envVar.WALLET_CONNECT_REDIS_CLUSTER_ENABLED),
    'redis.cluster.usePassword': fetchEnv(envVar.WALLET_CONNECT_REDIS_CLUSTER_USEPASSWORD),
  })
}
