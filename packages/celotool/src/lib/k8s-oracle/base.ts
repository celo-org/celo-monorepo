import { getFornoUrl, getFornoWebSocketUrl, getFullNodeHttpRpcInternalUrl, getFullNodeWebSocketRpcInternalUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv, fetchEnvOrFallback } from 'src/lib/env-utils'
import { installGenericHelmChart, removeGenericHelmChart, upgradeGenericHelmChart } from 'src/lib/helm_deploy'

const helmChartPath = '../helm-charts/oracle'

/**
 * Represents the identity of a single oracle
 */
export interface OracleIdentity {
  address: string
}

export interface BaseOracleDeploymentConfig {
  context: string
  identities: OracleIdentity[]
  useForno: boolean
}

export abstract class BaseOracleDeployer {
  protected _deploymentConfig: BaseOracleDeploymentConfig
  private _celoEnv: string

  constructor(deploymentConfig: BaseOracleDeploymentConfig, celoEnv: string) {
    this._deploymentConfig = deploymentConfig
    this._celoEnv = celoEnv
  }

  async installChart() {
    return installGenericHelmChart(
      this.celoEnv,
      this.releaseName,
      helmChartPath,
      await this.helmParameters()
    )
  }

  async upgradeChart() {
    return upgradeGenericHelmChart(
      this.celoEnv,
      this.releaseName,
      helmChartPath,
      await this.helmParameters()
    )
  }

  async removeChart() {
    await removeGenericHelmChart(this.releaseName, this.celoEnv)
  }

  async helmParameters() {
    const httpRpcProviderUrl = this.deploymentConfig.useForno
      ? getFornoUrl(this.celoEnv)
      : getFullNodeHttpRpcInternalUrl(this.celoEnv)
    const wsRpcProviderUrl = this.deploymentConfig.useForno
      ? getFornoWebSocketUrl(this.celoEnv)
      : getFullNodeWebSocketRpcInternalUrl(this.celoEnv)
    return [
      `--set environment.name=${this.celoEnv}`,
      `--set image.repository=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_REPOSITORY)}`,
      `--set image.tag=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_TAG)}`,
      `--set oracle.replicas=${this.replicas}`,
      `--set oracle.rpcProviderUrls.http=${httpRpcProviderUrl}`,
      `--set oracle.rpcProviderUrls.ws=${wsRpcProviderUrl}`,
      `--set oracle.metrics.enabled=true`,
      `--set oracle.metrics.prometheusPort=9090`,
      `--set-string oracle.unusedOracleAddresses='${fetchEnvOrFallback(envVar.ORACLE_UNUSED_ORACLE_ADDRESSES, '').split(',').join('\\\,')}'`
    ].concat(await this.oracleIdentityHelmParameters())
  }

  /**
   * Returns an array of helm command line parameters for the oracle identities.
   */
  async oracleIdentityHelmParameters() {
    const params: string[] = []
    for (let i = 0; i < this.replicas; i++) {
      const oracleIdentity = this.deploymentConfig.identities[i]
      const prefix = `--set oracle.identities[${i}]`
      params.push(`${prefix}.address=${oracleIdentity.address}`)
    }
    return params
  }

  get deploymentConfig() {
    return this._deploymentConfig
  }

  get releaseName() {
    return `${this.celoEnv}-oracle`
  }

  get kubeNamespace() {
    return this.celoEnv
  }

  get celoEnv(): string {
    return this._celoEnv
  }

  get replicas(): number {
    return this.deploymentConfig.identities.length
  }

  get context(): string {
    return this.deploymentConfig.context
  }
}
