import fs from 'fs'
import fetch from 'node-fetch'
import { execCmdWithExitOnFailure } from './cmd-utils'
import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'
import { accessSecretVersion, getCurrentGcloudAccount } from './gcloud_utils'
import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from './helm_deploy'
import { outputIncludes } from './utils'

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
  blockscoutDBPassword: string
) {
  const valuesEnvFile = fs.existsSync(`${helmChartPath}/values-${celoEnv}.yaml`)
    ? `values-${celoEnv}.yaml`
    : `values.yaml`
  return installGenericHelmChart(
    celoEnv,
    releaseName,
    helmChartPath,
    await helmParameters(imageTag, blockscoutDBUsername, blockscoutDBPassword),
    true,
    valuesEnvFile
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
  blockscoutDBPassword: string
) {
  console.info(`Upgrading helm release ${helmReleaseName}`)
  const params = await helmParameters(imageTag, blockscoutDBUsername, blockscoutDBPassword)
  await upgradeGenericHelmChart(
    celoEnv,
    helmReleaseName,
    helmChartPath,
    params,
    `values-${helmReleaseName}.yaml`
  )

  console.info(`Helm release ${helmReleaseName} upgrade successful`)
}

async function helmParameters(
  imageTag: string,
  blockscoutDBUsername: string,
  blockscoutDBPassword: string
) {
  const currentGcloudAccount = await getCurrentGcloudAccount()
  const params = [
    `--set changeCause="Deployed ${imageTag} by ${currentGcloudAccount} on ${new Date().toISOString()}"`,
    `--set blockscout.image.tag=${imageTag}`,
    `--set blockscout.db.username=${blockscoutDBUsername}`,
    `--set blockscout.db.password=${blockscoutDBPassword}`,
    // this is a secret, it has to be managed differently, moving it here for now as I got rid of the useMetadataCrawler flag
    `--set blockscout.metadataCrawler.discordWebhookUrl=${fetchEnvOrFallback(
      envVar.METADATA_CRAWLER_DISCORD_WEBHOOK,
      ''
    )}`,
  ]
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
    const ingressFilePath = `/tmp/${celoEnv}-blockscout-web-ingress.yaml`
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
      location ~ /address/(.*)/token_transfers {
        return 301 /address/$1/token-transfers;
      }
      location ~ /address/(.*)/coin_balances {
        return 301 /address/$1/coin-balances;
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

export async function createGrafanaTagAnnotation(celoEnv: string, tag: string, suffix: string) {
  const currentGcloudAccount = await getCurrentGcloudAccount()
  const projectId = fetchEnv(envVar.GRAFANA_CLOUD_PROJECT_ID)
  const secretName = fetchEnv(envVar.GRAFANA_CLOUD_SECRET_NAME)
  const secretVersion = fetchEnv(envVar.GRAFANA_CLOUD_SECRET_VERSION)
  const secret = await accessSecretVersion(projectId, secretName, secretVersion)
  const token = JSON.parse(secret!)
  await fetch(`${token!.grafana_endpoint}/api/annotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token!.grafana_api_token}`,
    },
    body: JSON.stringify({
      text: `Deployed ${celoEnv} ${suffix} by ${currentGcloudAccount} with commit: \n \n
      <a href=\"https://github.com/celo-org/blockscout/commit/${tag}"> ${tag}</a>\n`,
      tags: ['deployment', celoEnv],
    }),
  })
}
