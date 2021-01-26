import fs from 'fs'
import { execCmdWithExitOnFailure } from './cmd-utils'
import { outputIncludes, switchToProjectFromEnv } from './utils'

// createServiceAccountIfNotExists creates a service account with the given name
// if it does not exist. Returns if the account was created.
export async function createServiceAccountIfNotExists(name: string) {
  await switchToProjectFromEnv()
  // TODO: add permissions for cloudsql editor to service account
  const serviceAccountExists = await outputIncludes(
    `gcloud iam service-accounts list`,
    name,
    `Service account ${name} exists, skipping creation`
  )
  if (!serviceAccountExists) {
    await execCmdWithExitOnFailure(
      `gcloud iam service-accounts create ${name} --display-name="${name}"`
    )
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

export async function getGcloudServiceAccountWithRoleKeyBase64(
  gcloudProjectName: string,
  serviceAccountName: string,
  role: string
) {
  await switchToProjectFromEnv(gcloudProjectName)

  await createServiceAccountWithRole(serviceAccountName, gcloudProjectName, role)

  const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
  const serviceAccountKeyPath = `/tmp/gcloud-key-${serviceAccountName}.json`
  await getServiceAccountKey(serviceAccountEmail, serviceAccountKeyPath)
  return fs.readFileSync(serviceAccountKeyPath).toString('base64')
}

// createGcloudServiceAccountWithRole creates a gcloud service account with a given
// name and the proper permissions for writing metrics to stackdriver
export async function createServiceAccountWithRole(serviceAccountName: string, gcloudProjectName: string, role: string) {
  await execCmdWithExitOnFailure(`gcloud config set project ${gcloudProjectName}`)
  const accountCreated = await createServiceAccountIfNotExists(serviceAccountName)
  if (accountCreated) {
    let serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
    while (!serviceAccountEmail) {
      serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
    }
    await execCmdWithExitOnFailure(
      `gcloud projects add-iam-policy-binding ${gcloudProjectName} --role ${role} --member serviceAccount:${serviceAccountEmail}`
    )
  }
}
