import { fetchEnv, fetchEnvOrFallback, isVmBased } from './env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from './helm_deploy'
import { execCmdWithExitOnFailure } from './utils'
import { getTxNodeLoadBalancerIP } from './vm-testnet-utils'

export async function installHelmChart(
  celoEnv: string,
  blockscoutDBUsername: string,
  blockscoutDBPassword: string,
  blockscoutDBConnectionName: string
) {
  return installGenericHelmChart(
    celoEnv,
    celoEnv + '-blockscout',
    '../helm-charts/blockscout',
    await helmParameters(
      celoEnv,
      blockscoutDBUsername,
      blockscoutDBPassword,
      blockscoutDBConnectionName
    )
  )
}

export async function removeHelmRelease(celoEnv: string) {
  await removeGenericHelmChart(celoEnv + '-blockscout')
}

export async function upgradeHelmChart(
  celoEnv: string,
  blockscoutDBUsername: string,
  blockscoutDBPassword: string,
  blockscoutDBConnectionName: string
) {
  console.info(`Upgrading helm release ${celoEnv}-blockscout`)
  const params = (await helmParameters(
    celoEnv,
    blockscoutDBUsername,
    blockscoutDBPassword,
    blockscoutDBConnectionName
  )).join(' ')
  if (process.env.CELOTOOL_VERBOSE === 'true') {
    await execCmdWithExitOnFailure(
      `helm upgrade --debug --dry-run ${celoEnv}-blockscout ../helm-charts/blockscout --namespace ${celoEnv} ${params}`
    )
  }
  await execCmdWithExitOnFailure(
    `helm upgrade ${celoEnv}-blockscout ../helm-charts/blockscout --namespace ${celoEnv} ${params}`
  )
  console.info(`Helm release ${celoEnv}-blockscout upgrade successful`)
}

async function helmParameters(
  celoEnv: string,
  blockscoutDBUsername: string,
  blockscoutDBPassword: string,
  blockscoutDBConnectionName: string
) {
  const params = [
    `--set domain.name=${fetchEnv('CLUSTER_DOMAIN_NAME')}`,
    `--set blockscout.image.repository=${fetchEnv('BLOCKSCOUT_DOCKER_IMAGE_REPOSITORY')}`,
    `--set blockscout.image.tag=${fetchEnv('BLOCKSCOUT_DOCKER_IMAGE_TAG')}`,
    `--set blockscout.db.username=${blockscoutDBUsername}`,
    `--set blockscout.db.password=${blockscoutDBPassword}`,
    `--set blockscout.db.connection_name=${blockscoutDBConnectionName.trim()}`,
    `--set blockscout.replicas=${fetchEnv('BLOCKSCOUT_WEB_REPLICAS')}`,
    `--set blockscout.subnetwork="${fetchEnvOrFallback('BLOCKSCOUT_SUBNETWORK_NAME', celoEnv)}"`,
    `--set promtosd.scrape_interval=${fetchEnv('PROMTOSD_SCRAPE_INTERVAL')}`,
    `--set promtosd.export_interval=${fetchEnv('PROMTOSD_EXPORT_INTERVAL')}`,
  ]
  if (isVmBased()) {
    const txNodeLbIp = getTxNodeLoadBalancerIP(celoEnv)
    params.push(`--set blockscout.jsonrpc_http_url=http://${txNodeLbIp}:8545`)
    params.push(`--set blockscout.jsonrpc_ws_url=ws://${txNodeLbIp}:8546`)
  }
  return params
}
