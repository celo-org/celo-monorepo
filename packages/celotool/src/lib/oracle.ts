// import { ensureLeading0x, privateKeyToAddress } from '@celo/utils/src/address'
// import { assignRoleIfNotAssigned, createIdentityIfNotExists, deleteIdentity, getAKSManagedServiceIdentityObjectId, getAKSServicePrincipalObjectId, getIdentity } from 'src/lib/azure'
// import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
// import { getFornoUrl, getFullNodeHttpRpcInternalUrl, getFullNodeWebSocketRpcInternalUrl } from 'src/lib/endpoints'
import { DynamicEnvVar, fetchEnv, envVar } from 'src/lib/env-utils'
// import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
// import { installGenericHelmChart, removeGenericHelmChart, upgradeGenericHelmChart } from 'src/lib/helm_deploy'
import { getCloudProviderFromContext, getContextDynamicEnvVarValues } from './context-utils'
// import { AKSClusterConfig } from './k8s-cluster/aks'
import { CloudProvider, BaseClusterManager } from './k8s-cluster/base'
import { AksHsmOracleDeployer, AksHsmOracleDeploymentConfig } from './k8s-oracle/aks-hsm'
import { BaseOracleDeployer } from './k8s-oracle/base'
import { getAzureHsmOracleIdentities, getAwsHsmOracleIdentities } from './k8s-oracle/utils'
import { AwsHsmOracleDeployer, AwsHsmOracleDeploymentConfig } from './k8s-oracle/aws-hsm'
import { AwsClusterConfig } from './k8s-cluster/aws'
import { AKSClusterConfig } from './k8s-cluster/aks'
import { AccountType, getPrivateKeysFor, privateKeyToAddress } from './generate_utils'
import { PrivateKeyOracleIdentity, PrivateKeyOracleDeploymentConfig, PrivateKeyOracleDeployer } from './k8s-oracle/pkey'
import { ensureLeading0x } from '@celo/utils/src/address'

/**
 * Maps each cloud provider to the correct function to get the appropriate full
 * node deployment config
 */
const deployerGetterByCloudProvider: {
  [key in CloudProvider]?: (celoEnv: string, context: string, useForno: boolean, clusterManager: BaseClusterManager) => BaseOracleDeployer
} = {
  [CloudProvider.AWS]: getAwsHsmOracleDeployer,
  [CloudProvider.AZURE]: getAksHsmOracleDeployer,
}

export function getOracleDeployerForContext(celoEnv: string, context: string, useForno: boolean, clusterManager: BaseClusterManager) {
  // If the mnemonic-based oracle address env var has a value, we should be using
  // the private key oracle deployer.
  const { addressesFromMnemonicCount } = getContextDynamicEnvVarValues(
    contextOracleMnemonicIdentityConfigDynamicEnvVars,
    context,
    {
      addressesFromMnemonicCount: '',
    }
  )
  if (addressesFromMnemonicCount) {
    const addressesFromMnemonicCountNum = parseInt(addressesFromMnemonicCount, 10)
    // This is a cloud-provider agnostic deployer because it doesn't rely
    // on cloud-specific HSMs
    return getPrivateKeyOracleDeployer(celoEnv, context, useForno, addressesFromMnemonicCountNum)
  }
  const cloudProvider: CloudProvider = getCloudProviderFromContext(context)
  return deployerGetterByCloudProvider[cloudProvider]!(celoEnv, context, useForno, clusterManager)
}

function getAksHsmOracleDeployer(celoEnv: string, context: string, useForno: boolean, clusterManager: BaseClusterManager) {
  return getAKSHSMOracleDeployer(celoEnv, context, useForno, clusterManager)
}

function getAKSHSMOracleDeployer(celoEnv: string, context: string, useForno: boolean, clusterManager: BaseClusterManager) {
  const { addressKeyVaults } = getContextDynamicEnvVarValues(
    contextAKSOracleKeyVaultIdentityConfigDynamicEnvVars,
    context,
    {
      addressKeyVaults: '',
    }
  )
  const identities = getAzureHsmOracleIdentities(addressKeyVaults)
  const deploymentConfig: AksHsmOracleDeploymentConfig = {
    context,
    clusterConfig: clusterManager.clusterConfig as AKSClusterConfig,
    identities,
    useForno,
  }
  return new AksHsmOracleDeployer(deploymentConfig, celoEnv)
}

function getAwsHsmOracleDeployer(celoEnv: string, context: string, useForno: boolean, clusterManager: BaseClusterManager) {
  return getAWSHSMOracleDeployer(celoEnv, context, useForno, clusterManager)
}

function getAWSHSMOracleDeployer(celoEnv: string, context: string, useForno: boolean, clusterManager: BaseClusterManager) {
  const { addressKeyAliases } = getContextDynamicEnvVarValues(
    contextAWSOracleKeyVaultIdentityConfigDynamicEnvVars,
    context,
    {
      addressKeyAliases: '',
    }
  )

  const identities = getAwsHsmOracleIdentities(addressKeyAliases)
  const deploymentConfig: AwsHsmOracleDeploymentConfig = {
    context,
    identities,
    useForno,
    clusterConfig: clusterManager.clusterConfig as AwsClusterConfig
  }
  return new AwsHsmOracleDeployer(deploymentConfig, celoEnv)
}

// const helmChartPath = '../helm-charts/oracle'
// const rbacHelmChartPath = '../helm-charts/oracle-rbac'
//
// /**
//  * Contains information needed when using Azure HSM signing
//  */
// interface AksHsmOracleIdentity {
//   identityName: string
//   keyVaultName: string
//   // If a resource group is not specified, it is assumed to be the same
//   // as the kubernetes cluster resource group specified in the AKSClusterConfig
//   resourceGroup?: string
// }
// //
// /**
//  * Represents the identity of a single oracle
//  */
// interface OracleIdentity {
//   address: string
//   // Used if generating oracle clients from a mnemonic
//   privateKey?: string,
//   // Used if using Azure HSM signing
//   azureHsmIdentity?: AksHsmOracleIdentity
// }

// /**
//  * Configuration of multiple oracles
//  */
// interface OracleConfig {
//   identities: OracleIdentity[]
// }

interface OracleAKSHSMIdentityConfig {
  addressKeyVaults: string
}

interface OracleAWSHSMIdentityConfig {
  addressKeyAliases: string
}

interface OracleMnemonicIdentityConfig {
  addressesFromMnemonicCount: string
}

/**
 * Env vars corresponding to each value for the OracleKeyVaultIdentityConfig for a particular context
 */
const contextAKSOracleKeyVaultIdentityConfigDynamicEnvVars: { [k in keyof OracleAKSHSMIdentityConfig]: DynamicEnvVar } = {
  addressKeyVaults: DynamicEnvVar.ORACLE_ADDRESS_AZURE_KEY_VAULTS,
}

/**
 * Env vars corresponding to each value for the OracleKeyVaultIdentityConfig for a particular context
 */
const contextAWSOracleKeyVaultIdentityConfigDynamicEnvVars: { [k in keyof OracleAWSHSMIdentityConfig]: DynamicEnvVar } = {
  addressKeyAliases: DynamicEnvVar.ORACLE_ADDRESS_AWS_KEY_ALIASES,
}

/**
 * Env vars corresponding to each value for the OracleMnemonicIdentityConfig for a particular context
 */
// @ts-ignore
const contextOracleMnemonicIdentityConfigDynamicEnvVars: { [k in keyof OracleMnemonicIdentityConfig]: DynamicEnvVar } = {
  addressesFromMnemonicCount: DynamicEnvVar.ORACLE_ADDRESSES_FROM_MNEMONIC_COUNT,
}
//
// function releaseName(celoEnv: string) {
//   return `${celoEnv}-oracle`
// }
//
// export async function installHelmChart(
//   celoEnv: string,
//   context: string,
//   useForno: boolean
// ) {
//   // First install the oracle-rbac helm chart.
//   // This must be deployed before so we can use a resulting auth token so that
//   // oracle pods can reach the K8s API server to change their aad labels
//   await installOracleRBACHelmChart(celoEnv, context)
//   // Then install the oracle helm chart
//   return installGenericHelmChart(
//     celoEnv,
//     releaseName(celoEnv),
//     helmChartPath,
//     await helmParameters(celoEnv, context, useForno)
//   )
// }
//
// export async function upgradeOracleChart(
//   celoEnv: string,
//   context: string,
//   useFullNodes: boolean
// ) {
//   await upgradeOracleRBACHelmChart(celoEnv, context)
//   return upgradeGenericHelmChart(
//     celoEnv,
//     releaseName(celoEnv),
//     helmChartPath,
//     await helmParameters(celoEnv, context, useFullNodes)
//   )
// }
//
// export async function removeHelmRelease(celoEnv: string, context: string) {
//   await removeGenericHelmChart(releaseName(celoEnv))
//   await removeOracleRBACHelmRelease(celoEnv)
//   const oracleConfig = getOracleConfig(context)
//   for (const identity of oracleConfig.identities) {
//     // If the identity is using Azure HSM signing, clean it up too
//     if (identity.azureHsmIdentity) {
//       await deleteOracleAzureIdentity(context, identity)
//     }
//   }
// // }
//
// async function helmParameters(celoEnv: string, context: string, useForno: boolean) {
//   const oracleConfig = getOracleConfig(context)
//
//   const replicas = oracleConfig.identities.length
//   const kubeServiceAccountSecretNames = await rbacServiceAccountSecretNames(celoEnv, replicas)
//
//   const httpRpcProviderUrl = useForno
//     ? getFornoUrl(celoEnv)
//     : getFullNodeHttpRpcInternalUrl(celoEnv)
//   // TODO: let forno support websockets
//   const wsRpcProviderUrl = getFullNodeWebSocketRpcInternalUrl(celoEnv)
//   return [
//     `--set environment.name=${celoEnv}`,
//     `--set image.repository=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_REPOSITORY)}`,
//     `--set image.tag=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_TAG)}`,
//     `--set kube.serviceAccountSecretNames='{${kubeServiceAccountSecretNames.join(',')}}'`,
//     `--set oracle.azureHsm.initTryCount=5`,
//     `--set oracle.azureHsm.initMaxRetryBackoffMs=30000`,
//     `--set oracle.replicas=${replicas}`,
//     `--set oracle.rpcProviderUrls.http=${httpRpcProviderUrl}`,
//     `--set oracle.rpcProviderUrls.ws=${wsRpcProviderUrl}`,
//     `--set oracle.metrics.enabled=true`,
//     `--set oracle.metrics.prometheusPort=9090`,
//     `--set-string oracle.unusedOracleAddresses='${fetchEnvOrFallback(envVar.ORACLE_UNUSED_ORACLE_ADDRESSES, '').split(',').join('\\\,')}'`
//   ].concat(await oracleIdentityHelmParameters(context, oracleConfig))
// }
//
// /**
//  * Returns an array of helm command line parameters for the oracle identities.
//  * Supports both private key and Azure HSM signing.
//  */
// async function oracleIdentityHelmParameters(
//   context: string,
//   oracleConfig: OracleConfig
// ) {
//   const replicas = oracleConfig.identities.length
//   let params: string[] = []
//   for (let i = 0; i < replicas; i++) {
//     const oracleIdentity = oracleConfig.identities[i]
//     const prefix = `--set oracle.identities[${i}]`
//     params.push(`${prefix}.address=${oracleIdentity.address}`)
//     // An oracle identity can specify either a private key or some information
//     // about an Azure Key Vault that houses an HSM with the address provided.
//     // We provide the appropriate parameters for both of those types of identities.
//     if (oracleIdentity.azureHsmIdentity) {
//       const azureIdentity = await createOracleAzureIdentityIfNotExists(context, oracleIdentity)
//       params = params.concat([
//         `${prefix}.azure.id=${azureIdentity.id}`,
//         `${prefix}.azure.clientId=${azureIdentity.clientId}`,
//         `${prefix}.azure.keyVaultName=${oracleIdentity.azureHsmIdentity.keyVaultName}`,
//       ])
//     } else if (oracleIdentity.privateKey) {
//       params.push(`${prefix}.privateKey=${oracleIdentity.privateKey}`)
//     } else {
//       throw Error(`Incomplete oracle identity: ${oracleIdentity}`)
//     }
//   }
//   return params
// }
//
// /**
//  * This creates an Azure identity for a specific oracle identity. Should only be
//  * called when an oracle identity is using an Azure Key Vault for HSM signing
//  */
// async function createOracleAzureIdentityIfNotExists(
//   context: string,
//   oracleIdentity: OracleIdentity
// ) {
//   const clusterConfig = getAKSClusterConfig(context)
//   const identity = await createIdentityIfNotExists(clusterConfig, oracleIdentity.azureHsmIdentity!.identityName!)
//   // We want to grant the identity for the cluster permission to manage the oracle identity.
//   // Get the correct object ID depending on the cluster configuration, either
//   // the service principal or the managed service identity.
//   // See https://github.com/Azure/aad-pod-identity/blob/b547ba86ab9b16d238db8a714aaec59a046afdc5/docs/readmes/README.role-assignment.md#obtaining-the-id-of-the-managed-identity--service-principal
//   let assigneeObjectId = await getAKSServicePrincipalObjectId(clusterConfig)
//   let assigneePrincipalType = 'ServicePrincipal'
//   if (!assigneeObjectId) {
//     assigneeObjectId = await getAKSManagedServiceIdentityObjectId(clusterConfig)
//     assigneePrincipalType = 'MSI'
//   }
//   await assignRoleIfNotAssigned(assigneeObjectId, assigneePrincipalType, identity.id, 'Managed Identity Operator')
//   // Allow the oracle identity to access the correct key vault
//   await setOracleKeyVaultPolicyIfNotSet(clusterConfig, oracleIdentity, identity)
//   return identity
// }
//
// async function setOracleKeyVaultPolicyIfNotSet(
//   clusterConfig: AKSClusterConfig,
//   oracleIdentity: OracleIdentity,
//   azureIdentity: any
// ) {
//   const keyPermissions = ['get', 'list', 'sign']
//   const keyVaultResourceGroup = oracleIdentity.azureHsmIdentity!.resourceGroup ?
//     oracleIdentity.azureHsmIdentity!.resourceGroup :
//     clusterConfig.resourceGroup
//   const [keyVaultPoliciesStr] = await execCmdWithExitOnFailure(
//     `az keyvault show --name ${oracleIdentity.azureHsmIdentity!.keyVaultName} -g ${keyVaultResourceGroup} --query "properties.accessPolicies[?objectId == '${azureIdentity.principalId}' && sort(permissions.keys) == [${keyPermissions.map(perm => `'${perm}'`).join(', ')}]]"`
//   )
//   const keyVaultPolicies = JSON.parse(keyVaultPoliciesStr)
//   if (keyVaultPolicies.length) {
//     console.info(`Skipping setting key permissions, ${keyPermissions.join(' ')} already set for vault ${oracleIdentity.azureHsmIdentity!.keyVaultName} and identity objectId ${azureIdentity.principalId}`)
//     return
//   }
//   console.info(`Setting key permissions ${keyPermissions.join(' ')} for vault ${oracleIdentity.azureHsmIdentity!.keyVaultName} and identity objectId ${azureIdentity.principalId}`)
//   return execCmdWithExitOnFailure(
//     `az keyvault set-policy --name ${oracleIdentity.azureHsmIdentity!.keyVaultName} --key-permissions ${keyPermissions.join(' ')} --object-id ${azureIdentity.principalId} -g ${keyVaultResourceGroup}`
//   )
// }
//
// /**
//  * deleteOracleAzureIdentity deletes the key vault policy and the oracle's managed identity
//  */
// async function deleteOracleAzureIdentity(
//   context: string,
//   oracleIdentity: OracleIdentity
// ) {
//   const clusterConfig = getAKSClusterConfig(context)
//   await deleteOracleKeyVaultPolicy(clusterConfig, oracleIdentity)
//   return deleteIdentity(clusterConfig, oracleIdentity.azureHsmIdentity!.identityName)
// }
//
// async function deleteOracleKeyVaultPolicy(
//   clusterConfig: AKSClusterConfig,
//   oracleIdentity: OracleIdentity
// ) {
//   const azureIdentity = await getIdentity(clusterConfig, oracleIdentity.azureHsmIdentity!.identityName)
//   return execCmdWithExitOnFailure(
//     `az keyvault delete-policy --name ${oracleIdentity.azureHsmIdentity!.keyVaultName} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
//   )
// }
//
// /**
//  * Gives a config for all oracles for a particular context
//  */
// function getOracleConfig(context: string): OracleConfig {
//   return {
//     identities: getOracleIdentities(context),
//   }
// }
//
// /**
//  * Returns an array of oracle identities. If the Azure Key Vault env var is specified,
//  * the identities are created from that. Otherwise, the identities are created
//  * with private keys generated by the mnemonic.
//  */
// function getOracleIdentities(context: string): OracleIdentity[] {
//   const { addressAzureKeyVaults } = getContextDynamicEnvVarValues(
//     // @ts-ignore
//     contextOracleKeyVaultIdentityConfigDynamicEnvVars,
//     context,
//     {
//       addressAzureKeyVaults: '',
//     }
//   )
//   // Give priority to key vault
//   if (addressAzureKeyVaults) {
//     return getAzureHsmOracleIdentities(addressAzureKeyVaults)
//   }
//
//   // If key vaults are not set, try from mnemonic
//   const { addressesFromMnemonicCount } = getContextDynamicEnvVarValues(
//     contextOracleMnemonicIdentityConfigDynamicEnvVars,
//     context,
//     {
//       addressesFromMnemonicCount: '',
//     }
//   )
//   if (addressesFromMnemonicCount) {
//     const addressesFromMnemonicCountNum = parseInt(addressesFromMnemonicCount, 10)
//     return getMnemonicBasedOracleIdentities(addressesFromMnemonicCountNum)
//   }
//
//   throw Error('No oracle identity env vars specified')
// }
//
// /**
//  * Given a string addressAzureKeyVaults of the form:
//  * <address>:<keyVaultName>,<address>:<keyVaultName>
//  * eg: 0x0000000000000000000000000000000000000000:keyVault0,0x0000000000000000000000000000000000000001:keyVault1
//  * returns an array of OracleIdentity in the same order
//  */
// // @ts-ignore
// function getAzureHsmOracleIdentities1(addressAzureKeyVaults: string): OracleIdentity[] {
//   const identityStrings = addressAzureKeyVaults.split(',')
//   const identities = []
//   for (const identityStr of identityStrings) {
//     const [address, keyVaultName, resourceGroup] = identityStr.split(':')
//     // resourceGroup can be undefined
//     if (!address || !keyVaultName) {
//       throw Error(
//         `Address or key vault name is invalid. Address: ${address} Key Vault Name: ${keyVaultName}`
//       )
//     }
//     identities.push({
//       address,
//       azureHsmIdentity: {
//         identityName: getOracleAzureIdentityName(keyVaultName, address),
//         keyVaultName,
//         resourceGroup
//       }
//     })
//   }
//   return identities
// }
//
/**
 * Returns oracle identities with private keys and addresses generated from the mnemonic
 */
function getPrivateKeyOracleDeployer(celoEnv: string, context: string, useForno: boolean, count: number): PrivateKeyOracleDeployer {
  const identities: PrivateKeyOracleIdentity[] = getPrivateKeysFor(
    AccountType.PRICE_ORACLE,
    fetchEnv(envVar.MNEMONIC),
    count
  ).map((pkey) => ({
    address: privateKeyToAddress(pkey),
    privateKey: ensureLeading0x(pkey)
  }))
  const deploymentConfig: PrivateKeyOracleDeploymentConfig = {
    context,
    identities,
    useForno
  }
  return new PrivateKeyOracleDeployer(deploymentConfig, celoEnv)
}
//
// /**
//  * @return the intended name of an azure identity given a key vault name and address
//  */
// function getOracleAzureIdentityName(keyVaultName: string, address: string) {
//   // from https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftmanagedidentity
//   const maxIdentityNameLength = 128
//   return `${keyVaultName}-${address}`.substring(0, maxIdentityNameLength)
// }
//
// // Oracle RBAC------
// // We need the oracle pods to be able to change their label to accommodate
// // limitations in aad-pod-identity & statefulsets (see https://github.com/Azure/aad-pod-identity/issues/237#issuecomment-611672987)
// // To do this, we use an auth token that we get using the resources in the `oracle-rbac` chart
//
// async function installOracleRBACHelmChart(celoEnv: string, context: string) {
//   return installGenericHelmChart(
//     celoEnv,
//     rbacReleaseName(celoEnv),
//     rbacHelmChartPath,
//     rbacHelmParameters(celoEnv, context)
//   )
// }
//
// async function upgradeOracleRBACHelmChart(celoEnv: string, context: string) {
//   return upgradeGenericHelmChart(
//     celoEnv,
//     rbacReleaseName(celoEnv),
//     rbacHelmChartPath,
//     rbacHelmParameters(celoEnv, context)
//   )
// }
//
// function removeOracleRBACHelmRelease(celoEnv: string) {
//   return removeGenericHelmChart(rbacReleaseName(celoEnv))
// }
//
// function rbacHelmParameters(celoEnv: string,  context: string) {
//   const oracleConfig = getOracleConfig(context)
//   const replicas = oracleConfig.identities.length
//   return [`--set environment.name=${celoEnv}`,  `--set oracle.replicas=${replicas}`,]
// }
//
// function rbacReleaseName(celoEnv: string) {
//   return `${celoEnv}-oracle-rbac`
// }
//
// async function rbacServiceAccountSecretNames(celoEnv: string, replicas: number) {
//   const names = [...Array(replicas).keys()].map(i => `${rbacReleaseName(celoEnv)}-${i}`)
//   const [tokenName] = await execCmdWithExitOnFailure(
//     `kubectl get serviceaccount --namespace=${celoEnv} ${names.join(' ')} -o=jsonpath="{.items[*].secrets[0]['name']}"`
//   )
//   const tokenNames = tokenName.trim().split(' ')
//   return tokenNames
// }
