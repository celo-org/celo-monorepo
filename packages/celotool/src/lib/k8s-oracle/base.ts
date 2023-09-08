import {
  getFornoUrl,
  getFornoWebSocketUrl,
  getLightNodeHttpRpcInternalUrl,
  getLightNodeWebSocketRpcInternalUrl,
} from 'src/lib/endpoints'
import { envVar, fetchEnv, fetchEnvOrFallback } from 'src/lib/env-utils'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'

const helmChartPath = '../helm-charts/oracle'

export type CurrencyPair = 'CELOUSD' | 'CELOEUR' | 'CELOBTC'

/**
 * Represents the identity of a single oracle
 */
export interface OracleIdentity {
  address: string
  currencyPair: CurrencyPair
}

export interface BaseOracleDeploymentConfig {
  context: string
  currencyPair: CurrencyPair
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
    return installGenericHelmChart({
      namespace: this.celoEnv,
      releaseName: this.releaseName,
      chartDir: helmChartPath,
      parameters: await this.helmParameters(),
      buildDependencies: true,
      valuesOverrideFile: `${this.currencyPair}.yaml`,
    })
  }

  async upgradeChart() {
    return upgradeGenericHelmChart({
      namespace: this.celoEnv,
      releaseName: this.releaseName,
      chartDir: helmChartPath,
      parameters: await this.helmParameters(),
      buildDependencies: true,
      valuesOverrideFile: `${this.currencyPair}.yaml`,
    })
  }

  async removeChart() {
    await removeGenericHelmChart(this.releaseName, this.celoEnv)
  }

  async helmParameters() {
    const httpRpcProviderUrl = this.deploymentConfig.useForno
      ? getFornoUrl(this.celoEnv)
      : getLightNodeHttpRpcInternalUrl(this.celoEnv)
    const wsRpcProviderUrl = this.deploymentConfig.useForno
      ? getFornoWebSocketUrl(this.celoEnv)
      : getLightNodeWebSocketRpcInternalUrl(this.celoEnv)
    return [
      `--set-literal oracle.api_keys=${fetchEnv(envVar.ORACLE_FX_ADAPTERS_API_KEYS)}`,
      `--set environment.name=${this.celoEnv}`,
      `--set image.repository=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_REPOSITORY)}`,
      `--set image.tag=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_TAG)}`,
      `--set oracle.replicas=${this.replicas}`,
      `--set oracle.rpcProviderUrls.http=${httpRpcProviderUrl}`,
      `--set oracle.rpcProviderUrls.ws=${wsRpcProviderUrl}`,
      `--set-string oracle.unusedOracleAddresses='${fetchEnvOrFallback(
        envVar.ORACLE_UNUSED_ORACLE_ADDRESSES,
        ''
      )
        .split(',')
        .join('\\,')}'`,
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
    return `${this.celoEnv}-${this.currencyPair.toLocaleLowerCase()}-oracle`
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

  get currencyPair(): CurrencyPair {
    return this.deploymentConfig.currencyPair
  }
}
