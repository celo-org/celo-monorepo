import { clusterName, createIdentityIfNotExists, resourceGroup } from 'src/lib/azure'
import { getFornoUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { execCmdWithExitOnFailure } from 'src/lib/utils'

const helmChartPath = '../helm-charts/oracle'
const rbacHelmChartPath = '../helm-charts/oracle-rbac'

export async function installHelmChart(celoEnv: string) {
  // First install the oracle-rbac helm chart.
  // This must be deployed before so we can use a resulting auth token so that
  // oracle pods can reach the K8s API server to change their aad labels
  await installOracleRBACHelmChart(celoEnv)
  // Then install the oracle helm chart
  return installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv)
  )
}

export async function removeHelmRelease(celoEnv: string) {
  await removeGenericHelmChart(releaseName(celoEnv))
  await removeOracleRBACHelmRelease(celoEnv)
}

async function helmParameters(celoEnv: string) {
  const kubeAuthTokenName = await rbacAuthTokenName(celoEnv)
  const replicas = oracleAddressesAndVaults().length
  return [
    `--set environment.name=${celoEnv}`,
    `--set image.repository=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set image.tag=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_TAG)}`,
    `--set kube.authTokenName=${kubeAuthTokenName}`,
    `--set oracle.azureHsm.initTryCount=5`,
    `--set oracle.azureHsm.initMaxRetryBackoffMs=30000`,
    `--set oracle.replicas=${replicas}`,
    `--set oracle.rpcProviderUrl=${getFornoUrl(celoEnv)}`,
    `--set oracle.metrics.enabled=true`,
    `--set oracle.metrics.prometheusPort=9090`,
  ].concat(await oracleIdentityHelmParameters(celoEnv))
}

async function oracleIdentityHelmParameters(celoEnv: string) {
  const addressesAndVaults = oracleAddressesAndVaults()
  const replicas = addressesAndVaults.length
  let params: string[] = []
  for (let i = 0; i < replicas; i++) {
    const identity = await createOracleIdentityIfNotExists(celoEnv, i)
    const { address, keyVaultName: vaultName } = addressesAndVaults[i]
    const prefix = `--set oracle.identities[${i}]`
    params = params.concat([
      `${prefix}.address=${address}`,
      `${prefix}.azure.id=${identity.id}`,
      `${prefix}.azure.clientId=${identity.clientId}`,
      `${prefix}.azure.keyVaultName=${vaultName}`,
    ])
  }
  return params
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-oracle`
}

async function createOracleIdentityIfNotExists(celoEnv: string, index: number) {
  const identity = await createIdentityIfNotExists(oracleIdentityName(celoEnv, index))

  // Grant the service principal permission to manage the oracle identity.
  // See: https://github.com/Azure/aad-pod-identity#6-set-permissions-for-mic
  const [rawServicePrincipalClientId] = await execCmdWithExitOnFailure(
    `az aks show -n ${clusterName()} --query servicePrincipalProfile.clientId -g ${resourceGroup()} -o tsv`
  )
  const servicePrincipalClientId = rawServicePrincipalClientId.trim()
  await execCmdWithExitOnFailure(
    `az role assignment create --role "Managed Identity Operator" --assignee ${servicePrincipalClientId} --scope ${identity.id}`
  )
  // Allow the oracle identity to access the correct key vault
  await execCmdWithExitOnFailure(
    `az keyvault set-policy --name ${keyVaultName(
      index
    )} --key-permissions {get,list,sign} --object-id ${identity.principalId} -g ${resourceGroup()}`
  )
  return identity
}

function oracleIdentityName(celoEnv: string, index: number) {
  return `${celoEnv}-oracle-${index}`
}

function keyVaultName(oracleIndex: number) {
  return oracleAddressesAndVaults()[oracleIndex].keyVaultName
}

// Decodes the env variable ORACLE_ADDRESS_KEY_VAULTS of the form:
//   <address>:<keyVaultName>,<address>:<keyVaultName>
//   eg: 0x0000000000000000000000000000000000000000:keyVault0,0x0000000000000000000000000000000000000001:keyVault1
// into an array in the same order
function oracleAddressesAndVaults(): Array<{
  address: string
  keyVaultName: string
}> {
  const vaultNamesAndAddresses = fetchEnv(envVar.ORACLE_ADDRESS_KEY_VAULTS).split(',')
  const addressesAndVaults = []
  for (const nameAndAddress of vaultNamesAndAddresses) {
    const [address, vaultName] = nameAndAddress.split(':')
    if (!address || !vaultName) {
      throw Error(
        `Address or key vault name is invalid. Address: ${address} Key Vault Name: ${vaultName}`
      )
    }
    addressesAndVaults.push({
      address,
      keyVaultName: vaultName,
    })
  }
  return addressesAndVaults
}

// Oracle RBAC------
// We need the oracle pods to be able to change their label to accommodate
// limitations in aad-pod-identity & statefulsets (see https://github.com/Azure/aad-pod-identity/issues/237#issuecomment-611672987)
// To do this, we use an auth token that we get using the resources in the `oracle-rbac` chart

async function installOracleRBACHelmChart(celoEnv: string) {
  return installGenericHelmChart(
    celoEnv,
    rbacReleaseName(celoEnv),
    rbacHelmChartPath,
    rbacHelmParameters(celoEnv)
  )
}

function removeOracleRBACHelmRelease(celoEnv: string) {
  return removeGenericHelmChart(rbacReleaseName(celoEnv))
}

function rbacHelmParameters(celoEnv: string) {
  return [`--set environment.name=${celoEnv}`]
}

function rbacReleaseName(celoEnv: string) {
  return `${celoEnv}-oracle-rbac`
}

async function rbacAuthTokenName(celoEnv: string) {
  const [tokenName] = await execCmdWithExitOnFailure(
    `kubectl get serviceaccount --namespace=${celoEnv} ${rbacReleaseName(
      celoEnv
    )} -o=jsonpath="{.secrets[0]['name']}"`
  )
  return tokenName.trim()
}
