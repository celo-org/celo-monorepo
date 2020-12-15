import { assignRoleIdempotent, createIdentityIdempotent, deleteIdentity, getAKSManagedServiceIdentityObjectId, getAKSServicePrincipalObjectId, getIdentity } from '../azure'
import { execCmdWithExitOnFailure } from '../cmd-utils'
import { AksClusterConfig } from '../k8s-cluster/aks'
import { BaseOracleDeploymentConfig, OracleIdentity } from './base'
import { RbacOracleDeployer } from './rbac'

/**
 * Contains information needed when using Azure HSM signing
 */
export interface AksHsmOracleIdentity extends OracleIdentity {
  keyVaultName: string
  resourceGroup: string
}

export interface AksHsmOracleDeploymentConfig extends BaseOracleDeploymentConfig {
  clusterConfig: AksClusterConfig,
  identities: AksHsmOracleIdentity[]
}

/**
 * AksHsmOracleDeployer manages deployments for HSM-based oracles on AKS
 */
export class AksHsmOracleDeployer extends RbacOracleDeployer {
  // Explicitly specify this so we enforce AksHsmOracleDeploymentConfig
  constructor(deploymentConfig: AksHsmOracleDeploymentConfig, celoEnv: string) {
    super(deploymentConfig, celoEnv)
  }

  async removeChart() {
    await super.removeChart()
    for (const identity of this.deploymentConfig.identities) {
      await this.deleteAzureHsmIdentity(identity)
    }
  }

  async helmParameters() {
    return [
      ...await super.helmParameters(),
      `--set kube.cloudProvider=azure`,
      `--set oracle.azureHsm.initTryCount=5`,
      `--set oracle.azureHsm.initMaxRetryBackoffMs=30000`,
      `--set oracle.walletType=AZURE_HSM`,
    ]
  }

  async oracleIdentityHelmParameters() {
    let params = await super.oracleIdentityHelmParameters()
    for (let i = 0; i < this.replicas; i++) {
      const oracleIdentity = this.deploymentConfig.identities[i]
      const prefix = `--set oracle.identities[${i}]`
      const azureIdentity = await this.createOracleAzureIdentityIdempotent(oracleIdentity)
      params = params.concat([
        `${prefix}.azure.id=${azureIdentity.id}`,
        `${prefix}.azure.clientId=${azureIdentity.clientId}`,
        `${prefix}.azure.keyVaultName=${oracleIdentity.keyVaultName}`,
      ])
    }
    return params
  }

  /**
   * Creates an Azure identity for a specific oracle identity with the
   * appropriate permissions to use its HSM.
   * Idempotent.
   */
  async createOracleAzureIdentityIdempotent(
    oracleHsmIdentity: AksHsmOracleIdentity
  ) {
    const identity = await createIdentityIdempotent(this.clusterConfig, this.azureHsmIdentityName(oracleHsmIdentity))
    // We want to grant the identity for the cluster permission to manage the oracle identity.
    // Get the correct object ID depending on the cluster configuration, either
    // the service principal or the managed service identity.
    // See https://github.com/Azure/aad-pod-identity/blob/b547ba86ab9b16d238db8a714aaec59a046afdc5/docs/readmes/README.role-assignment.md#obtaining-the-id-of-the-managed-identity--service-principal
    let assigneeObjectId = await getAKSServicePrincipalObjectId(this.clusterConfig)
    let assigneePrincipalType = 'ServicePrincipal'
    if (!assigneeObjectId) {
      assigneeObjectId = await getAKSManagedServiceIdentityObjectId(this.clusterConfig)
      assigneePrincipalType = 'MSI'
    }
    await assignRoleIdempotent(assigneeObjectId, assigneePrincipalType, identity.id, 'Managed Identity Operator')
    // Allow the oracle identity to access the correct key vault
    await this.setOracleKeyVaultPolicyIdempotent(oracleHsmIdentity, identity)
    return identity
  }

  /**
   * Ensures an Azure identity has the appropriate permissions to use its HSM
   * via a key vault policy.
   * Idempotent.
   */
  async setOracleKeyVaultPolicyIdempotent(
    oracleHsmIdentity: AksHsmOracleIdentity,
    azureIdentity: any
  ) {
    const keyPermissions = ['get', 'list', 'sign']
    const keyVaultResourceGroup = oracleHsmIdentity.resourceGroup
    const [keyVaultPoliciesStr] = await execCmdWithExitOnFailure(
      `az keyvault show --name ${oracleHsmIdentity.keyVaultName} -g ${keyVaultResourceGroup} --query "properties.accessPolicies[?objectId == '${azureIdentity.principalId}' && sort(permissions.keys) == [${keyPermissions.map(perm => `'${perm}'`).join(', ')}]]"`
    )
    const keyVaultPolicies = JSON.parse(keyVaultPoliciesStr)
    if (keyVaultPolicies.length) {
      console.info(`Skipping setting key permissions, ${keyPermissions.join(' ')} already set for vault ${oracleHsmIdentity.keyVaultName} and identity objectId ${azureIdentity.principalId}`)
      return
    }
    console.info(`Setting key permissions ${keyPermissions.join(' ')} for vault ${oracleHsmIdentity.keyVaultName} and identity objectId ${azureIdentity.principalId}`)
    return execCmdWithExitOnFailure(
      `az keyvault set-policy --name ${oracleHsmIdentity.keyVaultName} --key-permissions ${keyPermissions.join(' ')} --object-id ${azureIdentity.principalId} -g ${keyVaultResourceGroup}`
    )
  }

  /**
   * Deletes the key vault policy and the oracle's managed identity
   */
  async deleteAzureHsmIdentity(
    oracleHsmIdentity: AksHsmOracleIdentity
  ) {
    const identityName = this.azureHsmIdentityName(oracleHsmIdentity)
    console.info(`Deleting Azure identity ${identityName}`)
    await this.deleteOracleKeyVaultPolicy(oracleHsmIdentity)
    return deleteIdentity(this.clusterConfig, identityName)
  }

  /**
   * Deletes the key vault policy that allows an Azure managed identity to use
   * its HSM.
   */
  async deleteOracleKeyVaultPolicy(
    oracleHsmIdentity: AksHsmOracleIdentity
  ) {
    const azureIdentity = await getIdentity(this.clusterConfig, this.azureHsmIdentityName(oracleHsmIdentity))
    return execCmdWithExitOnFailure(
      `az keyvault delete-policy --name ${oracleHsmIdentity.keyVaultName} --object-id ${azureIdentity.principalId} -g ${oracleHsmIdentity.resourceGroup}`
    )
  }

  /**
   * @return the intended name of an azure identity
   */
  azureHsmIdentityName(identity: AksHsmOracleIdentity) {
    // Max length from https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftmanagedidentity
    return `${identity.keyVaultName}-${identity.address}`.substring(0, 128)
  }

  get deploymentConfig(): AksHsmOracleDeploymentConfig {
    return this._deploymentConfig as AksHsmOracleDeploymentConfig
  }

  get clusterConfig(): AksClusterConfig {
    return this.deploymentConfig.clusterConfig
  }
}
