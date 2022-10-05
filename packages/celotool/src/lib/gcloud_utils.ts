import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { execCmd } from './cmd-utils'
import { DynamicEnvVar, envVar, fetchEnv, getDynamicEnvVarValue } from './env-utils'

export async function getCurrentGcloudAccount() {
  const [output] = await execCmd('gcloud config get-value account')
  if (output.trim() === '') {
    throw new Error('No Gcloud account set')
  }
  return output.trim()
}

async function ensureGcloudInstalled() {
  try {
    await execCmd(`gcloud version`)
  } catch (error) {
    console.error('Gcloud is not installed')
    console.error(error)
    process.exit(1)
  }
}

export async function ensureAuthenticatedGcloudAccount() {
  await ensureGcloudInstalled()
  try {
    await getCurrentGcloudAccount()
  } catch (error) {
    // Try authenticating with a Keyfile under GOOGLE_APPLICATION_CREDENTIALS

    console.debug('Authenticating gcloud with keyfile')
    await execCmd(
      `gcloud auth activate-service-account --key-file=${fetchEnv(
        envVar.GOOGLE_APPLICATION_CREDENTIALS,
        'gcloud is not authenticated, and thus needs GOOGLE_APPLICATION_CREDENTIALS for automatic authentication'
      )}`
    )
  }

  try {
    await getCurrentGcloudAccount()
  } catch (error) {
    console.error('Could not setup gcloud with authentication')
    process.exit(1)
  }
}

export async function linkSAForWorkloadIdentity(celoEnv: string, context: string) {
  if (
    getDynamicEnvVarValue(
      DynamicEnvVar.FULL_NODES_USE_GSTORAGE_DATA,
      { context },
      'false'
    ).toLowerCase() === 'true'
  ) {
    await execCmd(
      `gcloud iam service-accounts add-iam-policy-binding --project ${fetchEnv(
        envVar.TESTNET_PROJECT_NAME
      )} \
        --role roles/iam.workloadIdentityUser \
        --member "serviceAccount:${fetchEnv(
          envVar.TESTNET_PROJECT_NAME
        )}.svc.id.goog[${celoEnv}/gcloud-storage-access]" chaindata-download@${fetchEnv(
        envVar.TESTNET_PROJECT_NAME
      )}.iam.gserviceaccount.com`
    )
  }
}

export async function delinkSAForWorkloadIdentity(celoEnv: string, context: string) {
  if (
    getDynamicEnvVarValue(
      DynamicEnvVar.FULL_NODES_USE_GSTORAGE_DATA,
      { context },
      'false'
    ).toLowerCase() === 'true'
  ) {
    await execCmd(
      `gcloud iam service-accounts remove-iam-policy-binding --project ${fetchEnv(
        envVar.TESTNET_PROJECT_NAME
      )} \
        --role roles/iam.workloadIdentityUser \
        --member "serviceAccount:${fetchEnv(
          envVar.TESTNET_PROJECT_NAME
        )}.svc.id.goog[${celoEnv}/gcloud-storage-access]" chaindata-download@${fetchEnv(
        envVar.TESTNET_PROJECT_NAME
      )}.iam.gserviceaccount.com`
    )
  }
}

export async function kubectlAnnotateKSA(celoEnv: string, context: string) {
  if (
    getDynamicEnvVarValue(
      DynamicEnvVar.FULL_NODES_USE_GSTORAGE_DATA,
      { context },
      'false'
    ).toLowerCase() === 'true'
  ) {
    await execCmd(
      `kubectl annotate serviceaccount \
        --namespace ${celoEnv} \
        gcloud-storage-access \
        --overwrite \
        iam.gke.io/gcp-service-account=chaindata-download@${fetchEnv(
          envVar.TESTNET_PROJECT_NAME
        )}.iam.gserviceaccount.com`
    )
  }
}

export async function removeKubectlAnnotateKSA(celoEnv: string, context: string) {
  if (
    getDynamicEnvVarValue(
      DynamicEnvVar.FULL_NODES_USE_GSTORAGE_DATA,
      { context },
      'false'
    ).toLowerCase() === 'true'
  ) {
    await execCmd(
      `kubectl annotate serviceaccount \
        --namespace ${celoEnv} \
        gcloud-storage-access \
        iam.gke.io/gcp-service-account=chaindata-download@${fetchEnv(
          envVar.TESTNET_PROJECT_NAME
        )}.iam.gserviceaccount.com-`
    )
  }
}

export async function accessSecretVersion(
  projectId: string,
  secretName: string,
  secretVersion: string
) {
  try {
    const client = new SecretManagerServiceClient()
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/${secretVersion}`,
    })

    const privateKey = version?.payload?.data?.toString()!

    if (!privateKey) {
      throw new Error('Key is empty or undefined')
    }

    return privateKey
  } catch (error) {
    console.info('Error retrieving key')
  }
}
