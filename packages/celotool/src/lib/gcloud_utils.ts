import { execCmd } from './cmd-utils'
import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'

async function getCurrentGcloudAccount() {
  const [output] = await execCmd('gcloud config get-value account')
  if (output.trim() === '') {
    throw new Error('No Gcloud account set')
  }
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

export async function linkSAForWorkloadIdentity(celoEnv: string) {
  if (fetchEnvOrFallback(envVar.USE_GSTORAGE_DATA, "false") === "true") {
    await execCmd(
      `gcloud iam service-accounts add-iam-policy-binding --project ${fetchEnv(envVar.TESTNET_PROJECT_NAME)} \
        --role roles/iam.workloadIdentityUser \
        --member "serviceAccount:celo-testnet.svc.id.goog[${celoEnv}/gcloud-storage-access]" chaindata-download@celo-testnet.iam.gserviceaccount.com`
    )
  }
}