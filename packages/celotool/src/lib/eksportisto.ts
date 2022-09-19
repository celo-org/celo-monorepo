import fs from 'fs'
import { execCmd, execCmdAndParseJson } from 'src/lib/cmd-utils'
import { envVar, fetchEnv, fetchEnvOrFallback } from 'src/lib/env-utils'
import {
  getConfigMapHashes,
  HelmAction,
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

const yaml = require('js-yaml')

const chartDir = '../helm-charts/eksportisto'

function baseName(suffix: string) {
  if (suffix.length > 0) {
    return `eksportisto-${suffix}`
  } else {
    return 'eksportisto'
  }
}

function releaseName(celoEnv: string, suffix: string) {
  return `${celoEnv}-${baseName(suffix)}`
}

interface Context {
  releaseName: string
  suffix: string
  celoEnv: string
}

function buildContext(celoEnv: string): Context {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '')

  return {
    releaseName: releaseName(celoEnv, suffix),
    celoEnv,
    suffix,
  }
}

export async function installHelmChart(celoEnv: string) {
  const context = buildContext(celoEnv)
  const params = await helmParameters(context)

  await installGenericHelmChart(
    context.celoEnv,
    context.releaseName,
    chartDir,
    params.concat(`--set configHash="${await getConfigMapHash(context, params, 'install')}"`)
  )
}

export async function upgradeHelmChart(celoEnv: string) {
  const context = buildContext(celoEnv)
  const params = await helmParameters(context)

  await upgradeGenericHelmChart(
    context.celoEnv,
    context.releaseName,
    chartDir,
    params.concat(`--set configHash="${await getConfigMapHash(context, params, 'upgrade')}"`)
  )
}

export async function removeHelmRelease(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '')
  await removeGenericHelmChart(releaseName(celoEnv, suffix), celoEnv)
}

async function getServiceAccountKeyBase64FromHelm(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '')
  const relName = releaseName(celoEnv, suffix)
  const installedCharts = await execCmdAndParseJson(`helm list --short -o json -n ${celoEnv}`)
  const chartInstalled = installedCharts.includes(relName)
  if (chartInstalled) {
    const [output] = await execCmd(`helm get values -n ${celoEnv} ${relName}`)
    const values: any = yaml.safeLoad(output)
    return values.serviceAccountBase64
  }
}

function getServiceAccountName(celoEnv: string) {
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '')
  return releaseName(celoEnv, suffix)
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

async function getConfigMapHash(context: Context, params: string[], action: HelmAction) {
  const hashes = await getConfigMapHashes(
    context.celoEnv,
    context.releaseName,
    chartDir,
    params,
    action
  )

  return hashes['eksportisto/templates/configmap.yaml']
}

interface NodeInfo {
  ip: string
  labels: Record<string, string>
  status: string
}

interface CeloNodes {
  tip: NodeInfo | undefined
  backfill: NodeInfo[]
}

export async function getInternalTxNodeIps(context: Context): Promise<CeloNodes> {
  const project = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  const instanceGroupURIs: string[] = await execCmdAndParseJson(
    `gcloud compute instance-groups list --project '${project}' --filter="name~'${context.celoEnv}-tx-node-lb-internal-group'"  --format json --uri`
  )

  if (instanceGroupURIs.length !== 1) {
    throw Error('Expecting one (and only one) instance group to match filter')
  }

  const instanceGroupURI = instanceGroupURIs[0]
  const instanceURIs: string[] = await execCmdAndParseJson(
    `gcloud compute instance-groups list-instances ${instanceGroupURI} --format json --uri`
  )

  const runningNodes = (
    await Promise.all(
      instanceURIs.map(async (instanceURI) => {
        const details = await execCmdAndParseJson(
          `gcloud compute instances describe ${instanceURI} --format json`
        )
        return {
          ip: details.networkInterfaces[0].networkIP,
          status: details.status,
          labels: details.labels ?? {},
        }
      })
    )
  ).filter((node) => node.status === 'RUNNING')

  const tipNodeLabel = `${baseName(context.suffix)}-tip`
  const backfillNodeLabel = `${baseName(context.suffix)}-backfill`

  return {
    tip: runningNodes.find((node) => node.labels[tipNodeLabel] === 'true'),
    backfill: runningNodes.filter((node) => node.labels[backfillNodeLabel] === 'true'),
  }
}

async function helmParameters(context: Context) {
  const { celoEnv } = context
  const suffix = fetchEnvOrFallback(envVar.EKSPORTISTO_SUFFIX, '')
  const params = [
    `--namespace ${celoEnv}`,
    `--set environment="${celoEnv}"`,
    `--set imageRepository="${fetchEnv(envVar.EKSPORTISTO_DOCKER_IMAGE_REPOSITORY)}"`,
    `--set imageTag="${fetchEnv(envVar.EKSPORTISTO_DOCKER_IMAGE_TAG)}"`,
    `--set deploymentSuffix=${suffix}`,
  ]

  const serviceAccountKeyBase64 = await getServiceAccountKeyBase64(celoEnv)
  const serviceAccountEmail = await getServiceAccountEmail(getServiceAccountName(celoEnv))
  await allowServiceAccountToWriteToBigquery(serviceAccountEmail)
  params.push(
    `--set bigquery.dataset=${celoEnv}_eksportisto`,
    `--set serviceAccountBase64="${serviceAccountKeyBase64}"`
  )

  params.push(`--set celoTipNodeIP="tx-nodes"`)
  params.push(`--set celoBackfillNodeIPs[0]="tx-nodes"`)

  return params
}
