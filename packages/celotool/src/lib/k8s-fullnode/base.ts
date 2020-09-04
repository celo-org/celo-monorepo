import { createNamespaceIfNotExists } from '../cluster'
import { envVar, fetchEnv, fetchEnvOrFallback } from '../env-utils'
import {
  deletePersistentVolumeClaims,
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from '../helm_deploy'
import { scaleResource } from '../kubernetes'

const helmChartPath = '../helm-charts/celo-fullnode'

export interface BaseFullNodeDeploymentConfig {
  diskSizeGb: number
  replicas: number
}

export abstract class BaseFullNodeDeployer {
  protected _deploymentConfig: BaseFullNodeDeploymentConfig
  private _celoEnv: string

  constructor(deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string) {
    this._deploymentConfig = deploymentConfig
    this._celoEnv = celoEnv
  }

  async installChart() {
    await createNamespaceIfNotExists(this.kubeNamespace)

    return installGenericHelmChart(
      this.kubeNamespace,
      this.releaseName,
      helmChartPath,
      await this.helmParameters()
    )
  }

  async upgradeChart(reset: boolean) {
    if (reset) {
      await scaleResource(this.celoEnv, 'StatefulSet', `${this.celoEnv}-fullnodes`, 0)
      await deletePersistentVolumeClaims(this.celoEnv, ['celo-fullnode'])
    }

    await upgradeGenericHelmChart(
      this.kubeNamespace,
      this.releaseName,
      helmChartPath,
      await this.helmParameters()
    )

    return scaleResource(this.celoEnv, 'StatefulSet', `${this.celoEnv}-fullnodes`, this._deploymentConfig.replicas)
  }

  async removeChart() {
    await removeGenericHelmChart(this.releaseName)
    await deletePersistentVolumeClaims(this.celoEnv, ['celo-fullnode'])
    await this.deallocateAllIPs()
  }

  async helmParameters() {
    const rpcApis = 'eth,net,rpc,web3'
    return [
      `--set namespace=${this.kubeNamespace}`,
      `--set replicaCount=${this._deploymentConfig.replicas}`,
      `--set storage.size=${this._deploymentConfig.diskSizeGb}Gi`,
      `--set geth.expose_rpc_externally=false`,
      `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
      `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
      `--set-string geth.rpc_apis='${rpcApis.split(',').join('\\\,')}'`,
      `--set geth.metrics=${fetchEnvOrFallback(envVar.GETH_ENABLE_METRICS, 'false')}`,
      `--set genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
      `--set genesis.network=${this.celoEnv}`,
      ...(await this.additionalHelmParameters())
    ]
  }

  abstract async additionalHelmParameters(): Promise<string[]>

  abstract async deallocateAllIPs(): Promise<void>

  get releaseName() {
    return `${this.celoEnv}-fullnodes`
  }

  get kubeNamespace() {
    return this.celoEnv
  }

  get staticIPNamePrefix() {
    return `${this.celoEnv}-fullnodes`
  }

  get celoEnv(): string {
    return this._celoEnv
  }
}
