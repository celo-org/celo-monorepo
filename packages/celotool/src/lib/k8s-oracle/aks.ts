import { BaseOracleDeployer, BaseOracleDeploymentConfig, OracleConfig, OracleIdentity } from './base'
import { installOracleRBACHelmChart, upgradeOracleRBACHelmChart, rbacServiceAccountSecretNames, removeOracleRBACHelmRelease } from './rbac'
import { deleteIdentity, getIdentity, createIdentityIfNotExists, getAKSManagedServiceIdentityObjectId, getAKSServicePrincipalObjectId, assignRoleIfNotAssigned } from '../azure'
import { getAKSClusterConfig, getContextDynamicEnvVarValues } from '../context-utils'
import { execCmdWithExitOnFailure } from '../cmd-utils'
import { AKSClusterConfig } from '../k8s-cluster/aks'
import { DynamicEnvVar } from '../env-utils'

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

export class AKSOracleDeployer extends BaseOracleDeployer {
  // Explicitly specify this so we enforce AKSOracleDeploymentConfig
  constructor(deploymentConfig: AKSOracleDeploymentConfig, celoEnv: string) {
    super(deploymentConfig, celoEnv)
  }

  async installChart() {
    // First install the oracle-rbac helm chart.
    // This must be deployed before so we can use a resulting auth token so that
    // oracle pods can reach the K8s API server to change their aad labels
    await installOracleRBACHelmChart(this.celoEnv, this.deploymentConfig.context)
    await super.installChart()
  }

  async upgradeChart() {
    await upgradeOracleRBACHelmChart(this.celoEnv, this.deploymentConfig.context)
    await super.upgradeChart()
  }

  async removeChart() {
    await removeOracleRBACHelmRelease(this.celoEnv)
    await super.removeChart()
  }

  async helmParameters() {
    const kubeServiceAccountSecretNames = await rbacServiceAccountSecretNames(this.celoEnv, this.replicas)
    return [
      ...await super.helmParameters(),
      `--set kube.serviceAccountSecretNames='{${kubeServiceAccountSecretNames.join(',')}}'`
    ]
  }

  async oracleIdentityHelmParameters() {
    let params = await super.oracleIdentityHelmParameters()
    for (let i = 0; i < this.replicas; i++) {
      const oracleIdentity = this.deploymentConfig.identities[i]
      const prefix = `--set oracle.identities[${i}]`
      const azureIdentity = await createOracleAzureIdentityIfNotExists(this.deploymentConfig.context, oracleIdentity)
      params = params.concat([
        `${prefix}.azure.id=${azureIdentity.id}`,
        `${prefix}.azure.clientId=${azureIdentity.clientId}`,
        `${prefix}.azure.keyVaultName=${oracleIdentity.keyVaultName}`,
      ])
    }
    return params
  }

  get deploymentConfig(): AKSOracleDeploymentConfig {
    return this.deploymentConfig as AKSOracleDeploymentConfig
  }
}


/**
 * This creates an Azure identity for a specific oracle identity. Should only be
 * called when an oracle identity is using an Azure Key Vault for HSM signing
 */
async function createOracleAzureIdentityIfNotExists(
  context: string,
  oracleHsmIdentity: OracleAzureHsmIdentity
) {
  const clusterConfig = getAKSClusterConfig(context)
  const identity = await createIdentityIfNotExists(clusterConfig, oracleHsmIdentity.identityName!)
  // We want to grant the identity for the cluster permission to manage the oracle identity.
  // Get the correct object ID depending on the cluster configuration, either
  // the service principal or the managed service identity.
  // See https://github.com/Azure/aad-pod-identity/blob/b547ba86ab9b16d238db8a714aaec59a046afdc5/docs/readmes/README.role-assignment.md#obtaining-the-id-of-the-managed-identity--service-principal
  let assigneeObjectId = await getAKSServicePrincipalObjectId(clusterConfig)
  let assigneePrincipalType = 'ServicePrincipal'
  if (!assigneeObjectId) {
    assigneeObjectId = await getAKSManagedServiceIdentityObjectId(clusterConfig)
    assigneePrincipalType = 'MSI'
  }
  await assignRoleIfNotAssigned(assigneeObjectId, assigneePrincipalType, identity.id, 'Managed Identity Operator')
  // Allow the oracle identity to access the correct key vault
  await setOracleKeyVaultPolicyIfNotSet(clusterConfig, oracleHsmIdentity, identity)
  return identity
}

async function setOracleKeyVaultPolicyIfNotSet(
  clusterConfig: AKSClusterConfig,
  oracleHsmIdentity: OracleAzureHsmIdentity,
  azureIdentity: any
) {
  const keyPermissions = ['get', 'list', 'sign']
  const keyVaultResourceGroup = oracleHsmIdentity.resourceGroup ?
    oracleHsmIdentity.resourceGroup :
    clusterConfig.resourceGroup
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
async function deleteOracleAzureIdentity(
  context: string,
  oracleHsmIdentity: OracleAzureHsmIdentity
) {
  const clusterConfig = getAKSClusterConfig(context)
  await deleteOracleKeyVaultPolicy(clusterConfig, oracleHsmIdentity)
  return deleteIdentity(clusterConfig, oracleHsmIdentity.identityName)
}

async function deleteOracleKeyVaultPolicy(
  clusterConfig: AKSClusterConfig,
  oracleHsmIdentity: OracleAzureHsmIdentity
) {
  const azureIdentity = await getIdentity(clusterConfig, oracleHsmIdentity.identityName)
  return execCmdWithExitOnFailure(
    `az keyvault delete-policy --name ${oracleHsmIdentity.keyVaultName} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
  )
}

interface OracleKeyVaultIdentityConfig {
  addressAzureKeyVaults: string
}

/**
 * Env vars corresponding to each value for the OracleKeyVaultIdentityConfig for a particular context
 */
const contextOracleKeyVaultIdentityConfigDynamicEnvVars: { [k in keyof OracleKeyVaultIdentityConfig]: DynamicEnvVar } = {
  addressAzureKeyVaults: DynamicEnvVar.ORACLE_ADDRESS_AZURE_KEY_VAULTS,
}

/**
 * Gives a config for all oracles for a particular context
 */
export function getOracleConfig(context: string): OracleConfig {
  return {
    identities: getOracleIdentities(context),
  }
}

/**
 * Returns an array of oracle identities. If the Azure Key Vault env var is specified,
 * the identities are created from that. Otherwise, the identities are created
 * with private keys generated by the mnemonic.
 */
function getOracleIdentities(context: string): OracleIdentity[] {
  const { addressAzureKeyVaults } = getContextDynamicEnvVarValues(
    contextOracleKeyVaultIdentityConfigDynamicEnvVars,
    context,
    {
      addressAzureKeyVaults: '',
    }
  )
  return getAzureHsmOracleIdentities(addressAzureKeyVaults)
}

/**
 * Given a string addressAzureKeyVaults of the form:
 * <address>:<keyVaultName>,<address>:<keyVaultName>
 * eg: 0x0000000000000000000000000000000000000000:keyVault0,0x0000000000000000000000000000000000000001:keyVault1
 * returns an array of OracleIdentity in the same order
 */
function getAzureHsmOracleIdentities(addressAzureKeyVaults: string): OracleAzureHsmIdentity[] {
  const identityStrings = addressAzureKeyVaults.split(',')
  const identities = []
  for (const identityStr of identityStrings) {
    const [address, keyVaultName, resourceGroup] = identityStr.split(':')
    // resourceGroup can be undefined
    if (!address || !keyVaultName) {
      throw Error(
        `Address or key vault name is invalid. Address: ${address} Key Vault Name: ${keyVaultName}`
      )
    }
    identities.push({
      address,
      identityName: getOracleAzureIdentityName(keyVaultName, address),
      keyVaultName,
      resourceGroup
    })
  }
  return identities
}

/**
 * @return the intended name of an azure identity given a key vault name and address
 */
function getOracleAzureIdentityName(keyVaultName: string, address: string) {
  // from https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftmanagedidentity
  const maxIdentityNameLength = 128
  return `${keyVaultName}-${address}`.substring(0, maxIdentityNameLength)
}
