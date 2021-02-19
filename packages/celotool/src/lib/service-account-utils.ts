import fs from 'fs'
import { execCmdWithExitOnFailure } from './cmd-utils'
import { outputIncludes, switchToProjectFromEnv } from './utils'
import { sleep } from '@celo/base'

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

export async function deleteServiceAccountIfExists(email: string) {
  await switchToProjectFromEnv()

  const serviceAccountExists = await outputIncludes(
    `gcloud iam service-accounts list`,
    email,
    `Service account ${email} exists, deleting`
  )
  if (serviceAccountExists) {
    await execCmdWithExitOnFailure(
      `gcloud iam service-accounts delete ${email} --quiet`
    )
  }
}

// getServiceAccountEmail returns the email of the service account with the
// given name
export async function getServiceAccountEmail(serviceAccountName: string) {
  const [output] = await execCmdWithExitOnFailure(
    `gcloud iam service-accounts list --filter="displayName:${serviceAccountName}" --format='value[terminator=""](email)'`
  )
  return output
}

// If the service account was just created, sometimes it takes a few seconds
// to be able to get the email. This retries getting the email.
export async function getServiceAccountEmailWithRetry(serviceAccountName: string, retryCount: number = 5) {
  let serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
  let retries = 0
  while (!serviceAccountEmail && retries < retryCount) {
    await sleep(500)
    serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
    retries++
  }
  return serviceAccountEmail
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
  return getServiceAccountKeyBase64(serviceAccountEmail)
}

export async function getServiceAccountKeyBase64(serviceAccountEmail: string) {
  const serviceAccountKeyPath = `/tmp/serviceAccountKey.json`
  await getServiceAccountKey(serviceAccountEmail, serviceAccountKeyPath)
  return fs.readFileSync(serviceAccountKeyPath).toString('base64')
}

// createGcloudServiceAccountWithRole creates a gcloud service account with a given
// name and the proper permissions for writing metrics to stackdriver
export async function createServiceAccountWithRole(serviceAccountName: string, gcloudProjectName: string, role: string) {
  await execCmdWithExitOnFailure(`gcloud config set project ${gcloudProjectName}`)
  const accountCreated = await createServiceAccountIfNotExists(serviceAccountName)
  if (accountCreated) {
    let serviceAccountEmail = await getServiceAccountEmailWithRetry(serviceAccountName)
    await execCmdWithExitOnFailure(
      `gcloud projects add-iam-policy-binding ${gcloudProjectName} --role ${role} --member serviceAccount:${serviceAccountEmail}`
    )
  }
}

export function validServiceAccountName(rawName: string) {
  return rawName.substring(0, 30).replace(/[^a-zA-Z0-9]+$/g, '')
}
