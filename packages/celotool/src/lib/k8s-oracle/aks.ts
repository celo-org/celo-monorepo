import { assignRoleIfNotAssigned, createIdentityIfNotExists, deleteIdentity, getAKSManagedServiceIdentityObjectId, getAKSServicePrincipalObjectId, getIdentity } from '../azure'
import { execCmdWithExitOnFailure } from '../cmd-utils'
import { getAKSClusterConfig } from '../context-utils'
import { AKSClusterConfig } from '../k8s-cluster/aks'
import { BaseOracleDeploymentConfig, OracleIdentity } from './base'
import { RBACOracleDeployer } from './rbac'

/**
 * Contains information needed when using Azure HSM signing
 */
export interface OracleAzureHsmIdentity extends OracleIdentity {
  identityName: string
  keyVaultName: string
  // If a resource group is not specified, it is assumed to be the same
  // as the kubernetes cluster resource group specified in the AKSClusterConfig
  resourceGroup?: string
}
//
// interface OracleKeyVaultIdentityConfig {
//   addressAzureKeyVaults: string
// }

export interface AKSOracleDeploymentConfig extends BaseOracleDeploymentConfig {
  clusterConfig: AKSClusterConfig,
  identities: OracleAzureHsmIdentity[]
}

// /**
//  * Represents the identity of a single oracle
//  */
// interface OracleIdentity {
//   address: string
//   // Used if generating oracle clients from a mnemonic
//   privateKey?: string,
//   // Used if using Azure HSM signing
//   azureHsmIdentity?: OracleAzureHsmIdentity
// }

// interface OracleKeyVaultIdentityConfig {
//   addressAzureKeyVaults: string
// }

// interface OracleMnemonicIdentityConfig {
//   addressesFromMnemonicCount: string
// }

export class AKSOracleDeployer extends RBACOracleDeployer {
  // Explicitly specify this so we enforce AKSOracleDeploymentConfig
  constructor(deploymentConfig: AKSOracleDeploymentConfig, celoEnv: string) {
    super(deploymentConfig, celoEnv)
  }

  async removeChart() {
    await super.removeChart()
    for (const identity of this.deploymentConfig.identities) {
      await this.deleteOracleAzureIdentity(identity)
    }
  }

  async oracleIdentityHelmParameters() {
    let params = await super.oracleIdentityHelmParameters()
    for (let i = 0; i < this.replicas; i++) {
      const oracleIdentity = this.deploymentConfig.identities[i]
      const prefix = `--set oracle.identities[${i}]`
      const azureIdentity = await this.createOracleAzureIdentityIfNotExists(oracleIdentity)
      params = params.concat([
        `${prefix}.azure.id=${azureIdentity.id}`,
        `${prefix}.azure.clientId=${azureIdentity.clientId}`,
        `${prefix}.azure.keyVaultName=${oracleIdentity.keyVaultName}`,
      ])
    }
    return params
  }

  /**
   * This creates an Azure identity for a specific oracle identity. Should only be
   * called when an oracle identity is using an Azure Key Vault for HSM signing
   */
  async createOracleAzureIdentityIfNotExists(
    oracleHsmIdentity: OracleAzureHsmIdentity
  ) {
    const identity = await createIdentityIfNotExists(this.clusterConfig, oracleHsmIdentity.identityName!)
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
    await assignRoleIfNotAssigned(assigneeObjectId, assigneePrincipalType, identity.id, 'Managed Identity Operator')
    // Allow the oracle identity to access the correct key vault
    await this.setOracleKeyVaultPolicyIfNotSet(oracleHsmIdentity, identity)
    return identity
  }

  async setOracleKeyVaultPolicyIfNotSet(
    oracleHsmIdentity: OracleAzureHsmIdentity,
    azureIdentity: any
  ) {
    const keyPermissions = ['get', 'list', 'sign']
    const keyVaultResourceGroup = oracleHsmIdentity.resourceGroup ?
      oracleHsmIdentity.resourceGroup :
      this.clusterConfig.resourceGroup
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
   * deleteOracleAzureIdentity deletes the key vault policy and the oracle's managed identity
   */
  async deleteOracleAzureIdentity(
    oracleHsmIdentity: OracleAzureHsmIdentity
  ) {
    await this.deleteOracleKeyVaultPolicy(oracleHsmIdentity)
    return deleteIdentity(this.clusterConfig, oracleHsmIdentity.identityName)
  }

  async deleteOracleKeyVaultPolicy(
    oracleHsmIdentity: OracleAzureHsmIdentity
  ) {
    const azureIdentity = await getIdentity(this.clusterConfig, oracleHsmIdentity.identityName)
    return execCmdWithExitOnFailure(
      `az keyvault delete-policy --name ${oracleHsmIdentity.keyVaultName} --object-id ${azureIdentity.principalId} -g ${this.clusterConfig.resourceGroup}`
    )
  }

  get deploymentConfig(): AKSOracleDeploymentConfig {
    return this._deploymentConfig as AKSOracleDeploymentConfig
  }

  get clusterConfig(): AKSClusterConfig {
    return this.deploymentConfig.clusterConfig
  }
}
