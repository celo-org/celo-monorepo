import { readFileSync, writeFileSync } from 'fs'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { outputIncludes } from 'src/lib/utils'
import { createNamespaceIfNotExists } from './cluster'
import { installGenericHelmChart, retrieveIPAddress, upgradeGenericHelmChart } from './helm_deploy'

const kongChartPath = '../helm-charts/kong'
const kongaChartPath = '../helm-charts/konga'

// One unique kong/a deployment per cluster
const kongReleaseName = 'kong'
const kongNamespace = 'kong'
const kongaReleaseName = 'konga'
const kongaNamespace = 'kong'

export async function installKong(celoEnv: string) {
  await createNamespaceIfNotExists(kongNamespace)
  await createUpdateKongConfigMap(celoEnv)
  // Update values in values-clabs.yaml file
  return installGenericHelmChart(
    kongNamespace,
    kongReleaseName,
    kongChartPath,
    await kongHelmParamenters(celoEnv),
    true,
    `values-clabs.yaml`
  )
}

export async function upgradeKong(celoEnv: string) {
  await createUpdateKongConfigMap(celoEnv)
  return upgradeGenericHelmChart(
    kongNamespace,
    kongReleaseName,
    kongChartPath,
    await kongHelmParamenters(celoEnv),
    `values-clabs.yaml`
  )
}

export async function installKonga(celoEnv: string) {
  await createNamespaceIfNotExists(kongaNamespace)
  // Update values in values.yaml file
  return installGenericHelmChart(
    kongaNamespace,
    kongaReleaseName,
    kongaChartPath,
    kongaHelmParamenters(celoEnv)
  )
}

export async function upgradeKonga(celoEnv: string) {
  return upgradeGenericHelmChart(
    kongaNamespace,
    kongaReleaseName,
    kongaChartPath,
    kongaHelmParamenters(celoEnv)
  )
}

export async function destroyKongAndKonga() {
  await execCmdWithExitOnFailure(`kubectl delete ns ${kongNamespace} ${kongaNamespace}`)
}

async function kongHelmParamenters(celoEnv: string) {
  // GCP Internal infra ips
  let trustedIPs =
    '130.211.0.0/22,35.191.0.0/16,173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22'
  const fornoPublicGlobalIp = await retrieveIPAddress(`${celoEnv}-forno-global-address`, 'global')
  trustedIPs = `${trustedIPs},${fornoPublicGlobalIp}/32`
  return [
    `--set kong.extraEnvVars[0].name=KONG_TRUSTED_IPS`,
    `--set kong.extraEnvVars[0].value='${trustedIPs.replace(/,/g, '\\,')}'`,
  ]
}

function kongaHelmParamenters(celoEnv: string) {
  return [`--set geth_rpc_service=${celoEnv}-fullnodes-rpc.${celoEnv}`]
}

/**
 * Creates a configMap with the kong configuration
 * Configuration is read from a kong config file inside the kong chart folder
 */
export async function createUpdateKongConfigMap(celoEnv: string) {
  const kongConfig = readFileSync(`${kongChartPath}/kong.conf`).toString()
  // We need to patch this file with the forno public ip as this ip will forward
  // the requests and need to put in the config file so kong/nginx can consider
  // that ip as internal
  let trustedIPs =
    '130.211.0.0/22,35.191.0.0/16,173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22'
  const fornoPublicGlobalIp = await retrieveIPAddress(`${celoEnv}-forno-global-address`, 'global')
  trustedIPs = `${trustedIPs},${fornoPublicGlobalIp}/32`
  const re = '/^trusted_ips = .+$/g'
  kongConfig.replace(re, `trusted_ips = ${trustedIPs}`)
  const kongConfigTmpFile = '/tmp/kong.conf'
  writeFileSync(kongConfigTmpFile, kongConfig)
  const configMapExists = await outputIncludes(
    `kubectl get cm -n ${kongNamespace} kong-config || true`,
    'kong-config'
  )
  if (configMapExists) {
    await execCmdWithExitOnFailure(
      `kubectl create cm kong-config -n ${kongNamespace} --from-file ${kongConfigTmpFile} -o yaml --dry-run | kubectl replace -f -`
    )
  } else {
    await execCmdWithExitOnFailure(
      `kubectl create cm kong-config -n ${kongNamespace} --from-file ${kongConfigTmpFile}`
    )
  }
}
