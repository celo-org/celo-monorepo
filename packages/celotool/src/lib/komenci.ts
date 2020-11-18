import { ensureLeading0x, privateKeyToAddress } from '@celo/utils/src/address'
import { assignRoleIdempotent, createIdentityIdempotent, deleteIdentity, getAKSManagedServiceIdentityObjectId, getAKSServicePrincipalObjectId, getIdentity } from 'src/lib/azure'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { getFornoUrl, getFullNodeHttpRpcInternalUrl, getFullNodeWebSocketRpcInternalUrl } from 'src/lib/endpoints'
import { DynamicEnvVar, envVar, fetchEnv, fetchEnvOrFallback } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
import { installGenericHelmChart, removeGenericHelmChart, upgradeGenericHelmChart } from 'src/lib/helm_deploy'
import { getAksClusterConfig, getContextDynamicEnvVarValues } from './context-utils'
import { AksClusterConfig } from './k8s-cluster/aks'

const helmChartPath = '../helm-charts/komenci'
const rbacHelmChartPath = '../helm-charts/komenci-rbac'

/**
 * Contains information needed when using Azure HSM signing
 */
interface KomenciAzureHsmIdentity {
  identityName: string
  keyVaultName: string
  // If a resource group is not specified, it is assumed to be the same
  // as the kubernetes cluster resource group specified in the AKSClusterConfig
  resourceGroup?: string
}

/**
 * Represents the identity of a single komenci relayer
 */
interface KomenciIdentity {
  address: string
  // Used if generating komenci relayers from a mnemonic
  privateKey?: string,
  // Used if using Azure HSM signing
  azureHsmIdentity?: KomenciAzureHsmIdentity
}

/**
 * Configuration of multiple relayers
 */
interface KomenciConfig {
  identities: KomenciIdentity[]
}

interface KomenciKeyVaultIdentityConfig {
  addressAzureKeyVaults: string
}

interface KomenciMnemonicIdentityConfig {
  addressesFromMnemonicCount: string
}

interface KomenciDatabaseConfig {
  host: string
  port: string
  username: string
  passwordVaultName: string
}

/**
 * Env vars corresponding to each value for the KomenciKeyVaultIdentityConfig for a particular context
 */
const contextKomenciKeyVaultIdentityConfigDynamicEnvVars: { [k in keyof KomenciKeyVaultIdentityConfig]: DynamicEnvVar } = {
  addressAzureKeyVaults: DynamicEnvVar.KOMENCI_ADDRESS_AZURE_KEY_VAULTS,
}

/**
 * Env vars corresponding to each value for the KomenciMnemonicIdentityConfig for a particular context
 */
const contextKomenciMnemonicIdentityConfigDynamicEnvVars: { [k in keyof KomenciMnemonicIdentityConfig]: DynamicEnvVar } = {
  addressesFromMnemonicCount: DynamicEnvVar.KOMENCI_ADDRESSES_FROM_MNEMONIC_COUNT,
}


const contextDatabaseConfigDynamicEnvVars: { [k in keyof KomenciDatabaseConfig]: DynamicEnvVar } = {
  host: DynamicEnvVar.KOMENCI_DB_HOST,
  port: DynamicEnvVar.KOMENCI_DB_PORT,
  username: DynamicEnvVar.KOMENCI_DB_USERNAME,
  passwordVaultName: DynamicEnvVar.KOMENCI_DB_PASSWORD_VAULT_NAME
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-komenci`
}

export async function installHelmChart(
  celoEnv: string,
  context: string,
  useForno: boolean
) {
  // First install the komenci-rbac helm chart.
  // This must be deployed before so we can use a resulting auth token so that
  // komenci pods can reach the K8s API server to change their aad labels
  await installKomenciRBACHelmChart(celoEnv, context)
  // Then install the komenci helm chart
  return installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv, context, useForno)
  )
}

export async function upgradeKomenciChart(
  celoEnv: string,
  context: string,
  useFullNodes: boolean
) {
  await upgradeKomenciRBACHelmChart(celoEnv, context)
  return upgradeGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv, context, useFullNodes)
  )
}

export async function removeHelmRelease(celoEnv: string, context: string) {
  await removeGenericHelmChart(releaseName(celoEnv), celoEnv)
  await removeKomenciRBACHelmRelease(celoEnv)
  const komenciConfig = getKomenciConfig(context)
  for (const identity of komenciConfig.identities) {
    // If the identity is using Azure HSM signing, clean it up too
    if (identity.azureHsmIdentity) {
      await deleteKomenciAzureIdentity(context, identity)
    }
  }
}

async function getPasswordFromKeyVaultSecret(vaultName: string, secretName: string){
  const [password] = await execCmdWithExitOnFailure(
    `az keyvault secret show --name ${secretName} --vault-name ${vaultName} --query value`
  )
  return password.replace(/\n|"/g, '')
}

async function helmParameters(celoEnv: string, context: string, useForno: boolean) {
  const komenciConfig = getKomenciConfig(context)

  const replicas = komenciConfig.identities.length
  const kubeServiceAccountSecretNames = await rbacServiceAccountSecretNames(celoEnv, replicas)

  const databaseConfig = getContextDynamicEnvVarValues(
    contextDatabaseConfigDynamicEnvVars,
    context
  )
  const vars = getContextDynamicEnvVarValues(
    {
      network: DynamicEnvVar.KOMENCI_NETWORK,
      reCaptchaKeyVault: DynamicEnvVar.KOMENCI_RECAPTCHA_SECRET_VAULT_NAME,
      captchaBypassEnabled: DynamicEnvVar.KOMENCI_RULE_CONFIG_CAPTCHA_BYPASS_ENABLED,
    },
    context
  )
  const httpRpcProviderUrl = useForno
    ? getFornoUrl(celoEnv)
    : getFullNodeHttpRpcInternalUrl(celoEnv)
  // TODO: let forno support websockets
  const wsRpcProviderUrl = getFullNodeWebSocketRpcInternalUrl(celoEnv)
  const databasePassword = await getPasswordFromKeyVaultSecret(databaseConfig.passwordVaultName, 'DB-PASSWORD')
  const recaptchaToken = await getPasswordFromKeyVaultSecret(vars.reCaptchaKeyVault, 'RECAPTCHA-SECRET-KEY')
  const clusterConfig = getAksClusterConfig(context)

  return [
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set environment.name=${celoEnv}`,
    `--set image.repository=${fetchEnv(envVar.KOMENCI_DOCKER_IMAGE_REPOSITORY)}`,
    `--set image.tag=${fetchEnv(envVar.KOMENCI_DOCKER_IMAGE_TAG)}`,
    `--set kube.serviceAccountSecretNames='{${kubeServiceAccountSecretNames.join(',')}}'`,
    `--set komenci.azureHsm.initTryCount=5`,
    `--set komenci.azureHsm.initMaxRetryBackoffMs=30000`,
    `--set onboarding.recaptchaToken=${recaptchaToken}`,
    `--set onboarding.replicas=${replicas}`,
    `--set onboarding.relayer.host=${celoEnv + "-relayer"}`,
    `--set onboarding.db.host=${databaseConfig.host}`,
    `--set onboarding.db.port=${databaseConfig.port}`,
    `--set onboarding.db.username=${databaseConfig.username}`,
    `--set onboarding.db.password=${databasePassword}`,
    `--set onboarding.onchain.network=${vars.network}`,
    `--set onboarding.publicHostname=${getPublicHostname(clusterConfig.regionName, celoEnv)}`,
    `--set onboarding.publicUrl=${'https://' + getPublicHostname(clusterConfig.regionName, celoEnv)}`,
    `--set onboarding.ruleConfig.captcha.bypassEnabled=${vars.captchaBypassEnabled}`,
    `--set onboarding.ruleConfig.captcha.bypassToken=${fetchEnv(envVar.KOMENCI_RULE_CONFIG_CAPTCHA_BYPASS_TOKEN)}`,
    `--set relayer.replicas=${replicas}`,
    `--set relayer.rpcProviderUrls.http=${httpRpcProviderUrl}`,
    `--set relayer.rpcProviderUrls.ws=${wsRpcProviderUrl}`,
    `--set relayer.metrics.enabled=true`,
    `--set relayer.metrics.prometheusPort=9090`,
    `--set relayer.onchain.network=${vars.network}`,
    `--set-string relayer.unusedKomenciAddresses='${fetchEnvOrFallback(envVar.KOMENCI_UNUSED_KOMENCI_ADDRESSES, '').split(',').join('\\\,')}'`
  ].concat(await komenciIdentityHelmParameters(context, komenciConfig))
}

function getPublicHostname(regionName: string, celoEnv: string): string{
  return regionName + '.komenci.' + celoEnv + '.' + fetchEnv(envVar.CLUSTER_DOMAIN_NAME) + '.org'
}

/**
 * Returns an array of helm command line parameters for the komenci relayer identities.
 * Supports both private key and Azure HSM signing.
 */
async function komenciIdentityHelmParameters(
  context: string,
  komenciConfig: KomenciConfig
) {
  const replicas = komenciConfig.identities.length
  let params: string[] = []
  for (let i = 0; i < replicas; i++) {
    const komenciIdentity = komenciConfig.identities[i]
    const prefix = `--set relayer.identities[${i}]`
    params.push(`${prefix}.address=${komenciIdentity.address}`)
    // An komenci identity can specify either a private key or some information
    // about an Azure Key Vault that houses an HSM with the address provided.
    // We provide the appropriate parameters for both of those types of identities.
    if (komenciIdentity.azureHsmIdentity) {
      const azureIdentity = await createKomenciAzureIdentityIfNotExists(context, komenciIdentity)
      params = params.concat([
        `${prefix}.azure.id=${azureIdentity.id}`,
        `${prefix}.azure.clientId=${azureIdentity.clientId}`,
        `${prefix}.azure.keyVaultName=${komenciIdentity.azureHsmIdentity.keyVaultName}`,
      ])
    } else if (komenciIdentity.privateKey) {
      params.push(`${prefix}.privateKey=${komenciIdentity.privateKey}`)
    } else {
      throw Error(`Incomplete relayer identity: ${komenciIdentity}`)
    }
  }
  return params
}

/**
 * This creates an Azure identity for a specific komenci identity. Should only be
 * called when an komenci identity is using an Azure Key Vault for HSM signing
 */
async function createKomenciAzureIdentityIfNotExists(
  context: string,
  komenciIdentity: KomenciIdentity
) {
  const clusterConfig = getAksClusterConfig(context)
  const identity = await createIdentityIdempotent(clusterConfig, komenciIdentity.azureHsmIdentity!.identityName!)
  // We want to grant the identity for the cluster permission to manage the komenci identity.
  // Get the correct object ID depending on the cluster configuration, either
  // the service principal or the managed service identity.
  // See https://github.com/Azure/aad-pod-identity/blob/b547ba86ab9b16d238db8a714aaec59a046afdc5/docs/readmes/README.role-assignment.md#obtaining-the-id-of-the-managed-identity--service-principal
  let assigneeObjectId = await getAKSServicePrincipalObjectId(clusterConfig)
  let assigneePrincipalType = 'ServicePrincipal'
  // TODO Check how to manage the MSI type
  if (!assigneeObjectId) {
    assigneeObjectId = await getAKSManagedServiceIdentityObjectId(clusterConfig)
    // assigneePrincipalType = 'MSI'
    assigneePrincipalType = 'ServicePrincipal'
  }
  await assignRoleIdempotent(assigneeObjectId, assigneePrincipalType, identity.id, 'Managed Identity Operator')
  // Allow the komenci identity to access the correct key vault
  await setKomenciKeyVaultPolicyIfNotSet(clusterConfig, komenciIdentity, identity)
  return identity
}

async function setKomenciKeyVaultPolicyIfNotSet(
  clusterConfig: AksClusterConfig,
  komenciIdentity: KomenciIdentity,
  azureIdentity: any
) {
  const keyPermissions = ['get', 'list', 'sign']
  const keyVaultResourceGroup = komenciIdentity.azureHsmIdentity!.resourceGroup ?
    komenciIdentity.azureHsmIdentity!.resourceGroup :
    clusterConfig.resourceGroup
  const [keyVaultPoliciesStr] = await execCmdWithExitOnFailure(
    `az keyvault show --name ${komenciIdentity.azureHsmIdentity!.keyVaultName} -g ${keyVaultResourceGroup} --query "properties.accessPolicies[?objectId == '${azureIdentity.principalId}' && sort(permissions.keys) == [${keyPermissions.map(perm => `'${perm}'`).join(', ')}]]"`
  )
  const keyVaultPolicies = JSON.parse(keyVaultPoliciesStr)
  if (keyVaultPolicies.length) {
    console.info(`Skipping setting key permissions, ${keyPermissions.join(' ')} already set for vault ${komenciIdentity.azureHsmIdentity!.keyVaultName} and identity objectId ${azureIdentity.principalId}`)
    return
  }
  console.info(`Setting key permissions ${keyPermissions.join(' ')} for vault ${komenciIdentity.azureHsmIdentity!.keyVaultName} and identity objectId ${azureIdentity.principalId}`)
  return execCmdWithExitOnFailure(
    `az keyvault set-policy --name ${komenciIdentity.azureHsmIdentity!.keyVaultName} --key-permissions ${keyPermissions.join(' ')} --object-id ${azureIdentity.principalId} -g ${keyVaultResourceGroup}`
  )
}

/**
 * deleteKomenciAzureIdentity deletes the key vault policy and the komenci's managed identity
 */
async function deleteKomenciAzureIdentity(
  context: string,
  komenciIdentity: KomenciIdentity
) {
  const clusterConfig = getAksClusterConfig(context)
  await deleteKomenciKeyVaultPolicy(clusterConfig, komenciIdentity)
  return deleteIdentity(clusterConfig, komenciIdentity.azureHsmIdentity!.identityName)
}

async function deleteKomenciKeyVaultPolicy(
  clusterConfig: AksClusterConfig,
  komenciIdentity: KomenciIdentity
) {
  const azureIdentity = await getIdentity(clusterConfig, komenciIdentity.azureHsmIdentity!.identityName)
  return execCmdWithExitOnFailure(
    `az keyvault delete-policy --name ${komenciIdentity.azureHsmIdentity!.keyVaultName} --object-id ${azureIdentity.principalId} -g ${clusterConfig.resourceGroup}`
  )
}

/**
 * Gives a config for all komencis for a particular context
 */
function getKomenciConfig(context: string): KomenciConfig {
  return {
    identities: getKomenciIdentities(context),
  }
}

/**
 * Returns an array of komenci identities. If the Azure Key Vault env var is specified,
 * the identities are created from that. Otherwise, the identities are created
 * with private keys generated by the mnemonic.
 */
function getKomenciIdentities(context: string): KomenciIdentity[] {
  const { addressAzureKeyVaults } = getContextDynamicEnvVarValues(
    contextKomenciKeyVaultIdentityConfigDynamicEnvVars,
    context,
    {
      addressAzureKeyVaults: '',
    }
  )
  // Give priority to key vault
  if (addressAzureKeyVaults) {
    return getAzureHsmKomenciIdentities(addressAzureKeyVaults)
  }

  // If key vaults are not set, try from mnemonic
  const { addressesFromMnemonicCount } = getContextDynamicEnvVarValues(
    contextKomenciMnemonicIdentityConfigDynamicEnvVars,
    context,
    {
      addressesFromMnemonicCount: '',
    }
  )
  if (addressesFromMnemonicCount) {
    const addressesFromMnemonicCountNum = parseInt(addressesFromMnemonicCount, 10)
    return getMnemonicBasedKomenciIdentities(addressesFromMnemonicCountNum)
  }

  throw Error('No komenci identity env vars specified')
}

/**
 * Given a string addressAzureKeyVaults of the form:
 * <address>:<keyVaultName>,<address>:<keyVaultName>
 * eg: 0x0000000000000000000000000000000000000000:keyVault0,0x0000000000000000000000000000000000000001:keyVault1
 * returns an array of KomenciIdentity in the same order
 */
function getAzureHsmKomenciIdentities(addressAzureKeyVaults: string): KomenciIdentity[] {
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
      azureHsmIdentity: {
        identityName: getKomenciAzureIdentityName(keyVaultName, address),
        keyVaultName,
        resourceGroup
      }
    })
  }
  return identities
}

/**
 * Returns komenci identities with private keys and addresses generated from the mnemonic
 */
function getMnemonicBasedKomenciIdentities(count: number): KomenciIdentity[] {
  return getPrivateKeysFor(
    AccountType.PRICE_ORACLE,
    fetchEnv(envVar.MNEMONIC),
    count
  ).map((pkey) => ({
    address: privateKeyToAddress(pkey),
    privateKey: ensureLeading0x(pkey),
  }))
}

/**
 * @return the intended name of an azure identity given a key vault name and address
 */
function getKomenciAzureIdentityName(keyVaultName: string, address: string) {
  // from https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules#microsoftmanagedidentity
  const maxIdentityNameLength = 128
  return `${keyVaultName}-${address}`.substring(0, maxIdentityNameLength)
}

// Komenci RBAC------
// We need the relayer pods to be able to change their label to accommodate
// limitations in aad-pod-identity & statefulsets (see https://github.com/Azure/aad-pod-identity/issues/237#issuecomment-611672987)
// To do this, we use an auth token that we get using the resources in the `komenci-rbac` chart

async function installKomenciRBACHelmChart(celoEnv: string, context: string) {
  return installGenericHelmChart(
    celoEnv,
    rbacReleaseName(celoEnv),
    rbacHelmChartPath,
    rbacHelmParameters(celoEnv, context)
  )
}

async function upgradeKomenciRBACHelmChart(celoEnv: string, context: string) {
  return upgradeGenericHelmChart(
    celoEnv,
    rbacReleaseName(celoEnv),
    rbacHelmChartPath,
    rbacHelmParameters(celoEnv, context)
  )
}

function removeKomenciRBACHelmRelease(celoEnv: string) {
  return removeGenericHelmChart(rbacReleaseName(celoEnv), celoEnv)
}

function rbacHelmParameters(celoEnv: string,  context: string) {
  const komenciConfig = getKomenciConfig(context)
  console.info(komenciConfig)
  const replicas = komenciConfig.identities.length
  return [`--set environment.name=${celoEnv}`,  `--set relayer.replicas=${replicas}`,]
}

function rbacReleaseName(celoEnv: string) {
  return `${celoEnv}-komenci-rbac`
}

async function rbacServiceAccountSecretNames(celoEnv: string, replicas: number) {
  const names = [...Array(replicas).keys()].map(i => `${rbacReleaseName(celoEnv)}-${i}`)
  const [tokenName] = await execCmdWithExitOnFailure(
    `kubectl get serviceaccount --namespace=${celoEnv} ${names.join(' ')} -o=jsonpath="{.items[*].secrets[0]['name']}"`
  )
  const tokenNames = tokenName.trim().split(' ')
  return tokenNames
}
