import { createNamespaceIfNotExists } from 'src/lib/cluster'
import {
  installGenericHelmChart,
  makeHelmParameters,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'
import { envVar, fetchEnv } from './env-utils'

const releaseName = 'walletconnect'
const releaseNamespace = 'walletconnect'

export const helmChartDir = '../helm-charts/wallet-connect'

export async function installWalletConnect() {
  await createNamespaceIfNotExists(releaseNamespace)
  await installGenericHelmChart({
    namespace: releaseNamespace,
    releaseName,
    chartDir: helmChartDir,
    parameters: helmParameters(),
  })
}

export async function upgradeWalletConnect() {
  await upgradeGenericHelmChart({
    namespace: releaseNamespace,
    releaseName,
    chartDir: helmChartDir,
    parameters: helmParameters(),
  })
}

export async function removeWalletConnect() {
  await removeGenericHelmChart(releaseName, releaseNamespace)
}

export function helmParameters() {
  return makeHelmParameters({
    'domain.name': fetchEnv(envVar.CLUSTER_DOMAIN_NAME),
    'walletconnect.image.repository': fetchEnv(envVar.WALLET_CONNECT_IMAGE_REPOSITORY),
    'walletconnect.image.tag': fetchEnv(envVar.WALLET_CONNECT_IMAGE_TAG),
    'redis.cluster.enabled': fetchEnv(envVar.WALLET_CONNECT_REDIS_CLUSTER_ENABLED),
    'redis.cluster.usePassword': fetchEnv(envVar.WALLET_CONNECT_REDIS_CLUSTER_USEPASSWORD),
  })
}
