import fs from 'fs'
import { execCmd, outputIncludes } from 'src/lib/cmd-utils'
import { envVar, fetchEnv, fetchEnvOrFallback, isVmBased } from 'src/lib/env-utils'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'
import {
  createServiceAccountIfNotExists,
  getServiceAccountEmail,
  getServiceAccountKey,
} from 'src/lib/service-account-utils'
import { switchToProjectFromEnv } from 'src/lib/utils'
import { getInternalTxNodeLoadBalancerIP } from 'src/lib/vm-testnet-utils'

const yaml = require('js-yaml')
const chartDirForVersion: Record<number, string> = {
  1: '../helm-charts/eksportisto',
  2: '../helm-charts/eksportisto-2.0',
}

function releaseName(celoEnv: string, suffix: string) {
  return `${celoEnv}-eksportisto-${suffix}`
}

export async function installHelmChart(celoEnv: string, version: number) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  const chartDir = chartDirForVersion[version]
  if (chartDir === undefined) {
    throw new Error('version has to be 1 or 2')
  }

  await installGenericHelmChart(
    celoEnv,
    releaseName(celoEnv, suffix),
    chartDir,
    await helmParameters(celoEnv)
  )
}

export async function upgradeHelmChart(celoEnv: string, version: number) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  const chartDir = chartDirForVersion[version]
  if (chartDir === undefined) {
    throw new Error('version has to be 1 or 2')
  }

  await upgradeGenericHelmChart(
    celoEnv,
    releaseName(celoEnv, suffix),
    chartDir,
    await helmParameters(celoEnv)
  )
}

export async function removeHelmRelease(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  await removeGenericHelmChart(releaseName(celoEnv, suffix), celoEnv)
}

function fetchSensitiveAccounts() {
  return JSON.stringify({})
}

async function getServiceAccountKeyBase64FromHelm(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  const relName = releaseName(celoEnv, suffix)
  const chartInstalled = await outputIncludes(`helm list -n ${celoEnv}`, `${relName}`)
  if (chartInstalled) {
    const [output] = await execCmd(`helm get values -n ${celoEnv} ${relName}`)
    const values: any = yaml.safeLoad(output)
    return values.serviceAccountBase64
  }
}

function getServiceAccountName(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  return `${celoEnv}-eksportisto-${suffix}`
}

async function getServiceAccountKeyBase64(celoEnv: string) {
  // First check if value already exist in helm release. If so we pass the same value
  // and we avoid creating a new key for the service account
  const serviceAccountKeyBase64 = await getServiceAccountKeyBase64FromHelm(celoEnv)
  if (serviceAccountKeyBase64) {
    return serviceAccountKeyBase64
  } else {
    // We do not have the service account key in helm so we need to create the SA (if it does not exist)
    // and create a new key for the service account in any case
    await switchToProjectFromEnv()
    const serviceAccountName = getServiceAccountName(celoEnv)
    await createServiceAccountIfNotExists(serviceAccountName)
    const serviceAccountEmail = await getServiceAccountEmail(serviceAccountName)
    const serviceAccountKeyPath = `/tmp/gcloud-key-${serviceAccountName}.json`
    await getServiceAccountKey(serviceAccountEmail, serviceAccountKeyPath)
    return fs.readFileSync(serviceAccountKeyPath).toString('base64')
  }
}

async function allowServiceAccountToWriteToBigquery(serviceAccountEmail: string) {
  // This should be less broad but I couldn't figure out how to do it
  const project = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  const [output] = await execCmd(
    `gcloud projects get-iam-policy ${project} --format json`,
    {},
    false,
    false
  )
  const policy = JSON.parse(output) as { bindings: Array<{ role: string; members: string[] }> }

  for (const binding of policy.bindings) {
    if (binding.role === 'roles/bigquery.dataOwner') {
      if (
        binding.members.find((m) => m === `serviceAccount:${serviceAccountEmail}`) !== undefined
      ) {
        console.info('Service account already has permissions, skipping policy update')
        return
      } else {
        binding.members = binding.members.concat(`serviceAccount:${serviceAccountEmail}`)
      }
    }
  }

  const fn = `/tmp/updated-policy.json`
  fs.writeFileSync(fn, JSON.stringify(policy))
  await execCmd(`gcloud projects set-iam-policy ${project} ${fn}`, {}, false, true)
}

async function helmParameters(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '1')
  const serviceAccountKeyBase64 = await getServiceAccountKeyBase64(celoEnv)
  const serviceAccountEmail = await getServiceAccountEmail(getServiceAccountName(celoEnv))
  await allowServiceAccountToWriteToBigquery(serviceAccountEmail)

  const params = [
    `--namespace ${celoEnv}`,
    `--set environment="${celoEnv}"`,
    `--set imageRepository="${fetchEnv(envVar.EKSPORTISTO_DOCKER_IMAGE_REPOSITORY)}"`,
    `--set imageTag="${fetchEnv(envVar.EKSPORTISTO_DOCKER_IMAGE_TAG)}"`,
    `--set deploymentSuffix=${suffix}`,
    `--set bigquery.dataset=${celoEnv}_eksportisto_${suffix}`,
    `--set bigquery.table=data`,
    `--set serviceAccountBase64="${serviceAccountKeyBase64}"`,
    `--set sensitiveAccountsBase64=${Buffer.from(fetchSensitiveAccounts())
      .toString('base64')
      .trim()}`,
  ]
  if (isVmBased()) {
    params.push(
      `--set web3ProviderWS="ws://${await getInternalTxNodeLoadBalancerIP(celoEnv)}:8546"`
    )
    params.push(
      `--set web3ProviderHTTP="http://${await getInternalTxNodeLoadBalancerIP(celoEnv)}:8545"`
    )
  } else {
    params.push(`--set web3ProviderWS="ws://tx-nodes:8546"`)
    params.push(`--set web3ProviderHTTP="http://tx-nodes:8545"`)
  }
  return params
}
