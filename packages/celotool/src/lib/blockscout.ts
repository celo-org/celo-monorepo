import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { execCmdWithExitOnFailure, fetchEnv } from 'src/lib/utils'

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
    helmParameters(blockscoutDBUsername, blockscoutDBPassword, blockscoutDBConnectionName)
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
  if (process.env.CELOTOOL_VERBOSE === 'true') {
    await execCmdWithExitOnFailure(
      `helm upgrade --debug --dry-run ${celoEnv}-blockscout ../helm-charts/blockscout --namespace ${celoEnv} ${helmParameters(
        blockscoutDBUsername,
        blockscoutDBPassword,
        blockscoutDBConnectionName
      ).join(' ')}`
    )
  }
  await execCmdWithExitOnFailure(
    `helm upgrade ${celoEnv}-blockscout ../helm-charts/blockscout --namespace ${celoEnv} ${helmParameters(
      blockscoutDBUsername,
      blockscoutDBPassword,
      blockscoutDBConnectionName
    ).join(' ')}`
  )
  console.info(`Helm release ${celoEnv}-blockscout upgrade successful`)
}

function helmParameters(
  blockscoutDBUsername: string,
  blockscoutDBPassword: string,
  blockscoutDBConnectionName: string
) {
  return [
    `--set domain.name=${fetchEnv('CLUSTER_DOMAIN_NAME')}`,
    `--set blockscout.image.repository=${fetchEnv('BLOCKSCOUT_DOCKER_IMAGE_REPOSITORY')}`,
    `--set blockscout.image.webTag=${fetchEnv('BLOCKSCOUT_WEB_DOCKER_IMAGE_TAG')}`,
    `--set blockscout.image.indexerTag=${fetchEnv('BLOCKSCOUT_INDEXER_DOCKER_IMAGE_TAG')}`,
    `--set blockscout.db.username=${blockscoutDBUsername}`,
    `--set blockscout.db.password=${blockscoutDBPassword}`,
    `--set blockscout.db.connection_name=${blockscoutDBConnectionName.trim()}`,
    `--set blockscout.replicas=${fetchEnv('BLOCKSCOUT_WEB_REPLICAS')}`,
    `--set promtosd.scrape_interval=${fetchEnv('PROMTOSD_SCRAPE_INTERVAL')}`,
    `--set promtosd.export_interval=${fetchEnv('PROMTOSD_EXPORT_INTERVAL')}`,
  ]
}
