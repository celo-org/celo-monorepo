import { range } from 'lodash'
import { createNamespaceIfNotExists } from '../cluster'
import { envVar, fetchEnv, fetchEnvOrFallback } from '../env-utils'
import { generatePrivateKeyWithDerivations, privateKeyToPublicKey } from '../generate_utils'
import { grantIamRoleForBucketOrObjectIdempotent, revokeIamRoleForBucketOrObjectIdempotent } from '../gsutil-utils'
import {
  deletePersistentVolumeClaims,
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart
} from '../helm_deploy'
import { scaleResource } from '../kubernetes'
import { createServiceAccountIfNotExists, getServiceAccountEmail, getServiceAccountEmailWithRetry, getServiceAccountKeyBase64, validServiceAccountName, deleteServiceAccountIfExists } from '../service-account-utils'

const helmChartPath = '../helm-charts/celo-fullnode'
const chainDataObjectReaderRole = 'roles/storage.legacyObjectReader'

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
  // If undefined, node keys will not be predetermined and will be random
  nodeKeyGenerationInfo?: NodeKeyGenerationInfo
}

export abstract class BaseFullNodeDeployer {
  protected _deploymentConfig: BaseFullNodeDeploymentConfig
  private _celoEnv: string
  protected _context: string
  protected useChainDataServiceAccountCredentials: boolean = false;

  constructor(deploymentConfig: BaseFullNodeDeploymentConfig, celoEnv: string, context: string) {
    this._deploymentConfig = deploymentConfig
    this._celoEnv = celoEnv
    this._context = context
  }

  // If the node key is generated, then a promise containing the enodes is returned.
  // Otherwise, the enode cannot be calculated deterministically so a Promise<void> is returned.
  async installChart(): Promise<string[] | void> {
    await createNamespaceIfNotExists(this.kubeNamespace)

    await installGenericHelmChart(
      this.kubeNamespace,
      this.releaseName,
      helmChartPath,
      await this.helmParameters()
    )

    if (this._deploymentConfig.nodeKeyGenerationInfo) {
      return this.getEnodes()
    }
  }

  // If the node key is generated, then a promise containing the enodes is returned.
  // Otherwise, the enode cannot be calculated deterministically so a Promise<void> is returned.
  async upgradeChart(reset: boolean): Promise<string[] | void> {
    if (reset) {
      await scaleResource(this.celoEnv, 'StatefulSet', `${this.celoEnv}-fullnodes`, 0)
      await deletePersistentVolumeClaims(this.celoEnv, ['celo-fullnode'])
    }

    await upgradeGenericHelmChart(
      this.kubeNamespace,
      this.releaseName,
      helmChartPath,
      await this.helmParameters(),
    )

    await scaleResource(this.celoEnv, 'StatefulSet', `${this.celoEnv}-fullnodes`, this._deploymentConfig.replicas)
    if (this._deploymentConfig.nodeKeyGenerationInfo) {
      return this.getEnodes()
    }
  }

  async removeChart() {
    await removeGenericHelmChart(this.releaseName, this.kubeNamespace)
    await deletePersistentVolumeClaims(this.celoEnv, ['celo-fullnode'])
    await this.deallocateAllIPs()
    if (this.useChainDataServiceAccountCredentials) {
      const serviceAccountEmail = await getServiceAccountEmail(this.chainDataServiceAccountName)
      // If the service account doesn't exist, there's nothing to do
      if (!serviceAccountEmail) {
        return
      }
      const member = `serviceAccount:${serviceAccountEmail}`
      await revokeIamRoleForBucketOrObjectIdempotent(
        this.chainDataGcsObjectPath,
        member,
        chainDataObjectReaderRole
      )
      await deleteServiceAccountIfExists(serviceAccountEmail)
    }
  }

  async helmParameters() {
    let nodeKeys: string[] | undefined
    if (this._deploymentConfig.nodeKeyGenerationInfo) {
      nodeKeys = range(this._deploymentConfig.replicas)
        .map((index: number) =>
          this.getPrivateKey(index)
        )
    }

    let gethFlags = ''
    if (this.celoEnv === 'baklava') {
      gethFlags = '--baklava'
    } else if (this.celoEnv === 'alfajores') {
      gethFlags = '--alfajores'
    }

    const useGstorageData = fetchEnvOrFallback(envVar.USE_GSTORAGE_DATA, "false").toLowerCase() === 'true'

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
      `--set geth.flags=${gethFlags}`,
      `--set geth.use_gstorage_data=${useGstorageData}`,
      `--set geth.gstorage_data_bucket=${fetchEnvOrFallback(envVar.GSTORAGE_DATA_BUCKET, "")}`,
      `--set chainDataServiceAccountKeyBase64=${useGstorageData ? await this.chainDataServiceAccountCredentialsBase64() : ''}`,
      ...(await this.additionalHelmParameters()),
      (nodeKeys ? `--set geth.node_keys='{${nodeKeys.join(',')}}'` : '')
    ]
  }

  async chainDataServiceAccountCredentialsBase64() {
    if (!this.useChainDataServiceAccountCredentials) {
      return ''
    }
    await createServiceAccountIfNotExists(
      this.chainDataServiceAccountName
    )
    // Retry here because sometimes it takes some time after service
    // account creation to get the email
    const serviceAccountEmail = await getServiceAccountEmailWithRetry(this.chainDataServiceAccountName)
    const member = `serviceAccount:${serviceAccountEmail}`
    await grantIamRoleForBucketOrObjectIdempotent(
      this.chainDataGcsObjectPath,
      member,
      chainDataObjectReaderRole
    )
    return getServiceAccountKeyBase64(serviceAccountEmail)
  }

  async getEnodes() {
    return Promise.all(
      range(this._deploymentConfig.replicas)
        .map(async (index: number) => {
          const publicKey = privateKeyToPublicKey(this.getPrivateKey(index))
          const ip = await this.getFullNodeIP(index)
          // Assumes 30303 is the port
          return `enode://${publicKey}@${ip}:30303`
        })
    )
  }

  getPrivateKey(index: number) {
    if (!this._deploymentConfig.nodeKeyGenerationInfo) {
      throw Error('The deployment config property nodeKeyGenerationInfo must be defined to get a full node private key')
    }
    return generatePrivateKeyWithDerivations(
      this._deploymentConfig.nodeKeyGenerationInfo!.mnemonic,
      [
        this._deploymentConfig.nodeKeyGenerationInfo!.derivationIndex,
        index
      ]
    )
  }

  abstract async additionalHelmParameters(): Promise<string[]>
  abstract async deallocateAllIPs(): Promise<void>
  abstract async getFullNodeIP(index: number): Promise<string>

  get releaseName() {
    return `${this.celoEnv}-fullnodes`
  }

  get kubeNamespace() {
    return this.celoEnv
  }

  get staticIPNamePrefix() {
    return `${this.celoEnv}-fullnodes`
  }

  get chainDataServiceAccountName() {
    return validServiceAccountName(
      `${this.celoEnv}-${this.context}-chaindata-reader`
    )
  }

  get chainDataGcsObjectPath() {
    return `gs://celo-chain-backup/${this.celoEnv}/chaindata-latest.tar.gz`
  }

  get celoEnv(): string {
    return this._celoEnv
  }

  get context(): string {
    return this._context
  }
}
