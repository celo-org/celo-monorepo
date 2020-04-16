import { clusterName, createIdentityIfNotExists, resourceGroup } from 'src/lib/azure'
import { getFornoUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { execCmdWithExitOnFailure } from 'src/lib/utils'

const helmChartPath = '../helm-charts/oracle'

export async function installHelmChart(celoEnv: string) {
  // await createOracleIdentityIfNotExists(celoEnv)
  return installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv)
  )
}

export async function removeHelmRelease(celoEnv: string) {
  await removeGenericHelmChart(releaseName(celoEnv))
}

async function helmParameters(celoEnv: string) {
  const identity = await createOracleIdentityIfNotExists(celoEnv)
  const addresses = oracleAddresses()
  return [
    `--set environmentName=${celoEnv}`,
    `--set replicas=${addresses.length}`,
    `--set image.repository=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set image.tag=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_TAG)}`,
    `--set oracle.addresses='{${addresses.join(',')}}'`,
    `--set oracle.web3ProviderUrl=${getFornoUrl(celoEnv)}`,
    // `--set azure.subscriptionId=${subscriptionId()}`,
    `--set azure.identity.id=${identity.id}`,
    `--set azure.identity.clientId=${identity.clientId}`,
    `--set azure.keyvault.vaultName=${keyVaultName()}`,
  ]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-oracle`
}

async function createOracleIdentityIfNotExists(celoEnv: string) {
  const identity = await createIdentityIfNotExists(oracleIdentityName(celoEnv))

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
    `az keyvault set-policy --name ${keyVaultName()} --key-permissions {get,list,sign} --object-id ${
      identity.principalId
    } -g ${resourceGroup()}`
  )
  return identity
}

function oracleIdentityName(celoEnv: string) {
  return `${celoEnv}-oracle`
}

function keyVaultName() {
  return fetchEnv(envVar.AZURE_ORACLE_KEY_VAULT_NAME)
}

// oracleAddresses returns an array of the comma separated addresses found in ORACLE_ADDRESSES
function oracleAddresses() {
  const oracleAddressesStr = fetchEnv(envVar.ORACLE_ADDRESSES)
  return oracleAddressesStr.split(',')
}
