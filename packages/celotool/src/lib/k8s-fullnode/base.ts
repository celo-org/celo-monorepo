import fs from 'fs'
import { range } from 'lodash'
import { readableContext } from 'src/lib/context-utils'
import { createNamespaceIfNotExists } from '../cluster'
import { envVar, fetchEnv, fetchEnvOrFallback } from '../env-utils'
import { generatePrivateKeyWithDerivations, privateKeyToPublicKey } from '../generate_utils'
import {
  deletePersistentVolumeClaims,
  installGenericHelmChart,
  isCelotoolHelmDryRun,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from '../helm_deploy'
import { scaleResource } from '../kubernetes'

const helmChartPath = 'oci://us-west1-docker.pkg.dev/devopsre/clabs-public-oci/celo-fullnode'
const chartVersion = '0.2.0'

export interface NodeKeyGenerationInfo {
  mnemonic: string
  // A derivation index to apply to the mnemonic.
  // Each full node will then have its node key derived like:
  // mnemonic.derive(derivationIndex).derive(fullNodeIndex)
  derivationIndex: number
}

export interface BaseFullNodeDeploymentConfig {
  diskSizeGb: number
  replicas: number
  rollingUpdatePartition: number
  rpcApis: string
  gcMode: string
  useGstoreData: string
  wsPort: number
  // If undefined, node keys will not be predetermined and will be random
  nodeKeyGenerationInfo?: NodeKeyGenerationInfo
}

export abstract class BaseFullNodeDeployer {
  protected _deploymentConfig: BaseFullNodeDeploymentConfig
  private _celoEnv: string

  constructor(deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string) {
    this._deploymentConfig = deploymentConfig
    this._celoEnv = celoEnv
  }

  // If the node key is generated, then a promise containing the enodes is returned.
  // Otherwise, the enode cannot be calculated deterministically so a Promise<void> is returned.
  async installChart(context: string): Promise<string[] | void> {
    await createNamespaceIfNotExists(this.kubeNamespace)

    await installGenericHelmChart({
      namespace: this.kubeNamespace,
      releaseName: this.releaseName,
      chartDir: helmChartPath,
      parameters: await this.helmParameters(context),
      chartVersion,
      buildDependencies: false,
    })

    if (this._deploymentConfig.nodeKeyGenerationInfo) {
      return this.getEnodes()
    }
  }

  // If the node key is generated, then a promise containing the enodes is returned.
  // Otherwise, the enode cannot be calculated deterministically so a Promise<void> is returned.
  async upgradeChart(context: string, reset: boolean): Promise<string[] | void> {
    if (isCelotoolHelmDryRun()) {
      await upgradeGenericHelmChart({
        namespace: this.kubeNamespace,
        releaseName: this.releaseName,
        chartDir: helmChartPath,
        parameters: await this.helmParameters(context),
        chartVersion,
        buildDependencies: false,
      })
    } else {
      if (reset) {
        await scaleResource(this.celoEnv, 'StatefulSet', `${this.celoEnv}-fullnodes`, 0)
        await deletePersistentVolumeClaims(this.celoEnv, ['celo-fullnode'])
      }

      await upgradeGenericHelmChart({
        namespace: this.kubeNamespace,
        releaseName: this.releaseName,
        chartDir: helmChartPath,
        parameters: await this.helmParameters(context),
        chartVersion,
        buildDependencies: false,
      })

      await scaleResource(
        this.celoEnv,
        'StatefulSet',
        `${this.celoEnv}-fullnodes`,
        this._deploymentConfig.replicas
      )
    }
    if (this._deploymentConfig.nodeKeyGenerationInfo) {
      return this.getEnodes()
    }
  }

  async removeChart() {
    await removeGenericHelmChart(this.releaseName, this.kubeNamespace)
    await deletePersistentVolumeClaims(this.celoEnv, ['celo-fullnode'])
    await this.deallocateAllIPs()
  }

  async helmParameters(context: string) {
    let nodeKeys: string[] | undefined
    if (this._deploymentConfig.nodeKeyGenerationInfo) {
      nodeKeys = range(this._deploymentConfig.replicas).map((index: number) =>
        this.getPrivateKey(index)
      )
    }

    const rpcApis = this._deploymentConfig.rpcApis
      ? this._deploymentConfig.rpcApis
      : 'eth,net,rpc,web3'
    const gcMode = this._deploymentConfig.gcMode ? this._deploymentConfig.gcMode : 'full'
    const customValuesFile = `${helmChartPath}/${this._celoEnv}-${readableContext(
      context
    )}-values.yaml`
    return [
      `--set namespace=${this.kubeNamespace}`,
      `--set replicaCount=${this._deploymentConfig.replicas}`,
      `--set geth.updateStrategy.rollingUpdate.partition=${this._deploymentConfig.rollingUpdatePartition}`,
      `--set storage.size=${this._deploymentConfig.diskSizeGb}Gi`,
      `--set geth.expose_rpc_externally=false`,
      `--set geth.gcmode=${gcMode}`,
      `--set geth.image.repository=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_REPOSITORY)}`,
      `--set geth.image.tag=${fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)}`,
      `--set-string geth.rpc_apis='${rpcApis.split(',').join('\\,')}'`,
      `--set geth.metrics=${fetchEnvOrFallback(envVar.GETH_ENABLE_METRICS, 'false')}`,
      `--set genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
      `--set genesis.network=${this.celoEnv}`,
      `--set geth.use_gstorage_data=${this._deploymentConfig.useGstoreData}`,
      `--set geth.ws_port=${this._deploymentConfig.wsPort}`,
      `--set geth.gstorage_data_bucket=${fetchEnvOrFallback('GSTORAGE_DATA_BUCKET', '')}`,
      ...(await this.additionalHelmParameters()),
      nodeKeys ? `--set geth.node_keys='{${nodeKeys.join(',')}}'` : '',
      fs.existsSync(customValuesFile) ? `-f ${customValuesFile}` : '',
    ]
  }

  async getEnodes() {
    return Promise.all(
      range(this._deploymentConfig.replicas).map(async (index: number) => {
        const publicKey = privateKeyToPublicKey(this.getPrivateKey(index))
        const ip = await this.getFullNodeIP(index)
        // Assumes 30303 is the port
        return `enode://${publicKey}@${ip}:30303`
      })
    )
  }

  getPrivateKey(index: number) {
    if (!this._deploymentConfig.nodeKeyGenerationInfo) {
      throw Error(
        'The deployment config property nodeKeyGenerationInfo must be defined to get a full node private key'
      )
    }
    return generatePrivateKeyWithDerivations(
      this._deploymentConfig.nodeKeyGenerationInfo!.mnemonic,
      [this._deploymentConfig.nodeKeyGenerationInfo!.derivationIndex, index]
    )
  }

  abstract additionalHelmParameters(): Promise<string[]>
  abstract deallocateAllIPs(): Promise<void>
  abstract getFullNodeIP(index: number): Promise<string>

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
