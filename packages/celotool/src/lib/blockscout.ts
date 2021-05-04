import fs from 'fs'
import { execCmdWithExitOnFailure } from './cmd-utils'
import { envVar, fetchEnv, fetchEnvOrFallback, isVmBased } from './env-utils'
import { getCurrentGcloudAccount } from './gcloud_utils'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from './helm_deploy'
import { outputIncludes } from './utils'
import { getInternalTxNodeLoadBalancerIP } from './vm-testnet-utils'

const helmChartPath = '../helm-charts/blockscout'

export function getInstanceName(celoEnv: string, dbSuffix: string) {
  return `${celoEnv}${dbSuffix}`
}

export function getReleaseName(celoEnv: string, dbSuffix: string) {
  return `${celoEnv}-blockscout${dbSuffix}`
}

export async function installHelmChart(
  celoEnv: string,
  releaseName: string,
  imageTag: string,
  blockscoutDBUsername: string,
  blockscoutDBPassword: string,
  blockscoutDBConnectionName: string
) {
  return installGenericHelmChart(
    celoEnv,
    releaseName,
    helmChartPath,
    await helmParameters(
      celoEnv,
      imageTag,
      blockscoutDBUsername,
      blockscoutDBPassword,
      blockscoutDBConnectionName
    ),
    true,
    `values-${celoEnv}.yaml`
  )
}

export async function removeHelmRelease(helmReleaseName: string, celoEnv: string) {
  await removeGenericHelmChart(helmReleaseName, celoEnv)
}

export async function upgradeHelmChart(
  celoEnv: string,
  helmReleaseName: string,
  imageTag: string,
  blockscoutDBUsername: string,
  blockscoutDBPassword: string,
  blockscoutDBConnectionName: string
) {
  console.info(`Upgrading helm release ${helmReleaseName}`)
  const params = await helmParameters(
    celoEnv,
    imageTag,
    blockscoutDBUsername,
    blockscoutDBPassword,
    blockscoutDBConnectionName
  )
  await upgradeGenericHelmChart(
    celoEnv,
    helmReleaseName,
    helmChartPath,
    params,
    `values-${celoEnv}.yaml`
  )

  console.info(`Helm release ${helmReleaseName} upgrade successful`)
}

async function helmParameters(
  celoEnv: string,
  imageTag: string,
  blockscoutDBUsername: string,
  blockscoutDBPassword: string,
  blockscoutDBConnectionName: string
) {
  const currentGcloudAccount = await getCurrentGcloudAccount()
  const privateNodes = parseInt(fetchEnv(envVar.PRIVATE_TX_NODES), 10)
  const useMetadataCrawler = fetchEnvOrFallback(
    envVar.BLOCKSCOUT_METADATA_CRAWLER_IMAGE_REPOSITORY,
    'false'
  )
  const params = [
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set blockscout.deployment.account="${currentGcloudAccount}"`,
    `--set blockscout.deployment.timestamp="${new Date().toISOString()}"`,
    `--set blockscout.image.repository=${fetchEnv(envVar.BLOCKSCOUT_DOCKER_IMAGE_REPOSITORY)}`,
    `--set blockscout.image.tag=${imageTag}`,
    `--set blockscout.db.username=${blockscoutDBUsername}`,
    `--set blockscout.db.password=${blockscoutDBPassword}`,
    `--set blockscout.db.connection_name=${blockscoutDBConnectionName.trim()}`,
    `--set blockscout.db.drop=${fetchEnvOrFallback(envVar.BLOCKSCOUT_DROP_DB, 'false')}`,
    `--set blockscout.subnetwork="${fetchEnvOrFallback(
      envVar.BLOCKSCOUT_SUBNETWORK_NAME,
      celoEnv
    )}"`,
    `--set blockscout.segment_key=${fetchEnvOrFallback(envVar.BLOCKSCOUT_SEGMENT_KEY, '')}`,
    `--set blockscout.networkID=${fetchEnv(envVar.NETWORK_ID)}`,
  ]
  if (useMetadataCrawler !== 'false') {
    params.push(
      `--set blockscout.metadata_crawler.image.repository=${fetchEnv(
        envVar.BLOCKSCOUT_METADATA_CRAWLER_IMAGE_REPOSITORY
      )}`,
      `--set blockscout.metadata_crawler.image.tag=${fetchEnv(
        envVar.BLOCKSCOUT_METADATA_CRAWLER_IMAGE_TAG
      )}`,
      `--set blockscout.metadata_crawler.schedule="${fetchEnv(
        envVar.BLOCKSCOUT_METADATA_CRAWLER_SCHEDULE
      )}"`,
      `--set blockscout.metadata_crawler.discord_webhook_url=${fetchEnvOrFallback(
        envVar.METADATA_CRAWLER_DISCORD_WEBHOOK,
        ''
      )}`,
      `--set blockscout.metadata_crawler.discord_cluster_name=${fetchEnvOrFallback(
        envVar.METADATA_CRAWLER_DISCORD_CLUSTER_NAME,
        celoEnv
      )}`
    )
  }
  if (isVmBased()) {
    const txNodeLbIp = await getInternalTxNodeLoadBalancerIP(celoEnv)
    params.push(`--set blockscout.jsonrpc_http_url=http://${txNodeLbIp}:8545`)
    params.push(`--set blockscout.jsonrpc_ws_url=ws://${txNodeLbIp}:8546`)
  } else if (privateNodes > 0) {
    params.push(`--set blockscout.jsonrpc_http_url=http://tx-nodes-private-headless:8545`)
    params.push(`--set blockscout.jsonrpc_ws_url=ws://tx-nodes-private-headless:8546`)
  } else {
    params.push(`--set blockscout.jsonrpc_http_url=http://tx-nodes-headless:8545`)
    params.push(`--set blockscout.jsonrpc_ws_url=ws://tx-nodes-headless:8546`)
  }
  return params
}

export async function createDefaultIngressIfNotExists(celoEnv: string, ingressName: string) {
  const ingressExists = await outputIncludes(
    `kubectl get ingress --namespace=${celoEnv}`,
    `${celoEnv}-blockscout-web-ingress`,
    `Common ingress already exists, skipping creation`
  )
  if (!ingressExists) {
    console.info(`Creating ingress ${celoEnv}-blockscout-web-ingress`)
    const ingressFilePath = `/tmp/${celoEnv}-blockscout-web-ingress.json`
    const ingressResource = `
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
    kubernetes.io/tls-acme: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: 8m
    nginx.ingress.kubernetes.io/configuration-snippet: |
    location ~ /admin/.* {
      deny all;
    }
    location ~ /wobserver/.* {
      deny all;
    }
  labels:
    app: blockscout
    chart: blockscout
  name: ${celoEnv}-blockscout-web-ingress
  namespace: ${celoEnv}
spec:
  rules:
  - host: ${celoEnv}-blockscout.${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}.org
    http:
      paths:
      - path: /api/v1/(decompiled_smart_contract|verified_smart_contracts)
        backend:
          serviceName: ${ingressName}-web
          servicePort: 4000
      - path: /(graphql|graphiql|api)
        backend:
          serviceName: ${ingressName}-api
          servicePort: 4000
      - backend:
          serviceName: ${ingressName}-web
          servicePort: 4000
        path: /
  tls:
  - hosts:
    - ${celoEnv}-blockscout.${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}.org
    secretName: ${celoEnv}-blockscout-web-tls
`
    fs.writeFileSync(ingressFilePath, ingressResource)
    await execCmdWithExitOnFailure(`kubectl create --namespace=${celoEnv} -f ${ingressFilePath}`)
  }
}

export async function switchIngressService(celoEnv: string, ingressName: string) {
  const command = `kubectl patch --namespace=${celoEnv} ing/${celoEnv}-blockscout-web-ingress --type=json\
   -p='[{"op": "replace", "path": "/spec/rules/0/http/paths/0/backend/serviceName", "value":"${ingressName}-web"}]'`
  await execCmdWithExitOnFailure(command)
}
