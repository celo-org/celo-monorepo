import { clusterName, createIdentityIfNotExists, resourceGroup } from 'src/lib/azure'
import { getFornoUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { execCmdWithExitOnFailure } from 'src/lib/utils'

const helmChartPath = '../helm-charts/oracle'

export async function installHelmChart(celoEnv: string) {
  return installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv),
    helmChartPath,
    await helmParameters(celoEnv)
  )
}

export async function removeHelmRelease(celoEnv: string) {
  await removeGenericHelmChart(releaseName(celoEnv))
  await deleteRBACResources(celoEnv)
}

async function helmParameters(celoEnv: string) {
  // const identity = await createOracleIdentityIfNotExists(celoEnv)
  const tokenName = await createRBACResources(celoEnv)
  const addresses = oracleAddresses()
  return [
    `--set environmentName=${celoEnv}`,
    `--set image.repository=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_REPOSITORY)}`,
    `--set image.tag=${fetchEnv(envVar.ORACLE_DOCKER_IMAGE_TAG)}`,
    // `--set oracle.addresses='{${addresses.join(',')}}'`,
    `--set oracle.replicas=${addresses.length}`,
    `--set oracle.token_name=${tokenName}`,
    `--set oracle.web3ProviderUrl=${getFornoUrl(celoEnv)}`,
    // `--set azure.identity.id=${identity.id}`,
    // `--set azure.identity.clientId=${identity.clientId}`,
    `--set azure.keyVault.name=${keyVaultName()}`,
  ].concat(await oracleIdentityHelmParameters(celoEnv))
}

async function oracleIdentityHelmParameters(celoEnv: string) {
  const addresses = oracleAddresses()
  const replicas = addresses.length
  let params: string[] = []
  for (let i = 0; i < replicas; i++) {
    const identity = await createOracleIdentityIfNotExists(celoEnv, i)
    const prefix = `--set oracle.identities[${i}]`
    params = params.concat([
      `${prefix}.address=${addresses[i]}`,
      `${prefix}.azure.id=${identity.id}`,
      `${prefix}.azure.clientId=${identity.clientId}`,
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
    `az keyvault set-policy --name ${keyVaultName()} --key-permissions {get,list,sign} --object-id ${
      identity.principalId
    } -g ${resourceGroup()}`
  )
  return identity
}

function oracleIdentityName(celoEnv: string, index: number) {
  return `${celoEnv}-oracle-${index}`
}

function keyVaultName() {
  return fetchEnv(envVar.AZURE_ORACLE_KEY_VAULT_NAME)
}

// oracleAddresses returns an array of the comma separated addresses found in ORACLE_ADDRESSES
function oracleAddresses() {
  const oracleAddressesStr = fetchEnv(envVar.ORACLE_ADDRESSES)
  return oracleAddressesStr.split(',')
}

async function createRBACResources(celoEnv: string) {
  await createOracleServiceAccount(celoEnv)
  await createOracleRole(celoEnv)
  await createOracleRoleBinding(celoEnv)
  const tokenName = await getSecretTokenName(celoEnv)
  return tokenName
}

async function createOracleServiceAccount(celoEnv: string) {
  const serviceAccountYaml = `
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${releaseName(celoEnv)}
  namespace: ${celoEnv}
EOF
`

  await execCmdWithExitOnFailure(`cat <<EOF | kubectl apply --filename - ${serviceAccountYaml}`)
}

async function createOracleRole(celoEnv: string) {
  const roleYaml = `
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: ${celoEnv}
  name: ${releaseName(celoEnv)}
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "update", "patch"]
EOF
`

  await execCmdWithExitOnFailure(`cat <<EOF | kubectl apply --filename - ${roleYaml}`)
}

async function createOracleRoleBinding(celoEnv: string) {
  const roleBindingYaml = `
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  namespace: ${celoEnv}
  name: ${releaseName(celoEnv)}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ${releaseName(celoEnv)}
subjects:
- kind: ServiceAccount
  name: ${releaseName(celoEnv)}
  namespace: ${celoEnv}
EOF
`

  await execCmdWithExitOnFailure(`cat <<EOF | kubectl apply --filename - ${roleBindingYaml}`)
}

async function getSecretTokenName(celoEnv: string) {
  const [tokenName] = await execCmdWithExitOnFailure(
    `kubectl get serviceaccount --namespace=${celoEnv} ${releaseName(
      celoEnv
    )} -o=jsonpath="{.secrets[0]['name']}"`
  )
  return tokenName.trim()
}

async function deleteRBACResources(celoEnv: string) {
  await execCmdWithExitOnFailure(`kubectl delete rolebinding -n ${celoEnv} ${releaseName(celoEnv)}`)
  await execCmdWithExitOnFailure(`kubectl delete role -n ${celoEnv} ${releaseName(celoEnv)}`)
  await execCmdWithExitOnFailure(
    `kubectl delete serviceaccount -n ${celoEnv} ${releaseName(celoEnv)}`
  )
}
