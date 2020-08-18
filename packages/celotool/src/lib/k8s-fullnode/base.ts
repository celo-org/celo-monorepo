import { FullNodeDeploymentConfig, getKubeNamespace, getReleaseName } from '../cloud-provider'
import { createNamespaceIfNotExists } from '../cluster'
import { envVar, fetchEnv, fetchEnvOrFallback } from '../env-utils'
import {
  deletePersistentVolumeClaims,
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from '../helm_deploy'
import { scaleResource } from '../kubernetes'


const helmChartPath = '../../helm-charts/celo-fullnode'

export interface BaseFullNodeDeploymentConfig {
  diskSizeGb: number
  replicas: number
}

export abstract class BaseFullNodeDeployer {

  protected _deploymentConfig: FullNodeDeploymentConfig

  constructor(deploymentConfig: FullNodeDeploymentConfig) {
    this._deploymentConfig = deploymentConfig
  }

  async installChart(celoEnv: string) {
    const kubeNamespace = getKubeNamespace(celoEnv)
    const releaseName = getReleaseName(celoEnv)
    await createNamespaceIfNotExists(kubeNamespace)

    return installGenericHelmChart(
      kubeNamespace,
      releaseName,
      helmChartPath,
      await this.helmParameters(celoEnv, kubeNamespace)
    )
  }

  async upgradeChart(
    celoEnv: string,
    reset: boolean
  ) {
    const kubeNamespace = getKubeNamespace(celoEnv)
    const releaseName = getReleaseName(celoEnv)

    if (reset) {
      await scaleResource(celoEnv, 'StatefulSet', `${celoEnv}-fullnodes`, 0)
      await deletePersistentVolumeClaims(celoEnv, ['celo-fullnode'])
    }

    await upgradeGenericHelmChart(
      kubeNamespace,
      releaseName,
      helmChartPath,
      await this.helmParameters(celoEnv, celoEnv)
    )

    return scaleResource(celoEnv, 'StatefulSet', `${celoEnv}-fullnodes`, this._deploymentConfig.replicas)
  }

  async removeChart(celoEnv: string) {
    const releaseName = getReleaseName(celoEnv)
    await removeGenericHelmChart(releaseName)
    await deletePersistentVolumeClaims(celoEnv, ['celo-fullnode'])
    await this.deallocateIPs(celoEnv)
  }

  async helmParameters(
    celoEnv: string,
    kubeNamespace: string,
  ) {
    const rpcApis = 'eth,net,rpc,web3'
    return [
      `--set namespace=${kubeNamespace}`,
      `--set replicaCount=${this._deploymentConfig.replicas}`,
      `--set storage.size=${this._deploymentConfig.diskSizeGb}Gi`,
      `--set geth.expose_rpc_externally=false`,
      `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
      `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
      `--set-string geth.rpc_apis='${rpcApis.split(',').join('\\\,')}'`,
      `--set geth.metrics=${fetchEnvOrFallback(envVar.GETH_ENABLE_METRICS, 'false')}`,
      `--set genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
      `--set genesis.network=${celoEnv}`,
      ...(await this.additionalHelmParameters(celoEnv))
    ]
  }

  abstract async additionalHelmParameters(
    celoEnv: string,
  ): Promise<string[]>

  abstract async deallocateIPs(
    celoEnv: string,
  ): Promise<void>
}
