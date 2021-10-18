import { execCmdWithExitOnFailure } from './cmd-utils'
import { outputIncludes, switchToGCPProject, switchToProjectFromEnv } from './utils'

// createServiceAccountIfNotExists creates a service account with the given name
// if it does not exist. Returns if the account was created.
export async function createServiceAccountIfNotExists(
  name: string,
  gcloudProject?: string,
  description?: string
) {
  if (gcloudProject !== undefined) {
    await switchToGCPProject(gcloudProject)
  } else {
    await switchToProjectFromEnv()
  }
  // TODO: add permissions for cloudsql editor to service account
  const serviceAccountExists = await outputIncludes(
    `gcloud iam service-accounts list`,
    name,
    `GCP Service account ${name} exists, skipping creation`
  )
  if (!serviceAccountExists) {
    let cmd = `gcloud iam service-accounts create ${name} --display-name="${name}" `
    if (description) {
      cmd = cmd.concat(`--description=${description}`)
    }
    await execCmdWithExitOnFailure(cmd)
  }
  return !serviceAccountExists
}

// getServiceAccountEmail returns the email of the service account with the
// given name
export async function getServiceAccountEmail(serviceAccountName: string) {
  const [output] = await execCmdWithExitOnFailure(
    `gcloud iam service-accounts list --filter="displayName:${serviceAccountName}" --format='value[terminator=""](email)'`
  )
  return output
}

export function getServiceAccountKey(serviceAccountEmail: string, keyPath: string) {
  return execCmdWithExitOnFailure(
    `gcloud iam service-accounts keys create ${keyPath} --iam-account ${serviceAccountEmail}`
  )
}

// Used for Prometheus and Promtail/Loki
// https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity
export async function setupGKEWorkloadIdentities(
  serviceAccountName: string,
  gcloudProjectName: string,
  kubeNamespace: string,
  kubeServiceAccountName: string
) {
  // Only grant access to GCE API to Prometheus or Promtail SA deployed in GKE
  if (!serviceAccountName.includes('gcp')) {
    return
  }

  // Prometheus needs roles/compute.viewer to discover the VMs asking GCE API
  const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
  await execCmdWithExitOnFailure(
    `gcloud projects add-iam-policy-binding ${gcloudProjectName} --role roles/compute.viewer --member serviceAccount:${serviceAccountEmail}`
  )

  // Allow the Kubernetes service account to impersonate the Google service account
  await execCmdWithExitOnFailure(
    `gcloud iam --project ${gcloudProjectName} service-accounts add-iam-policy-binding \
    --role roles/iam.workloadIdentityUser \
    --member "serviceAccount:${gcloudProjectName}.svc.id.goog[${kubeNamespace}/${kubeServiceAccountName}]" \
    ${serviceAccountEmail}`
  )
}
