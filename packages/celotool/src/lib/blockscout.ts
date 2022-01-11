import fs from 'fs'
import { execCmdWithExitOnFailure } from './cmd-utils'
import { envVar, fetchEnv } from './env-utils'
import { getCurrentGcloudAccount } from './gcloud_utils'
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

export async function installHelmChart(celoEnv: string, releaseName: string, imageTag: string) {
  const valuesEnvFile = fs.existsSync(`${helmChartPath}/values-${celoEnv}.yaml`)
    ? `values-${celoEnv}.yaml`
    : `values.yaml`
  return installGenericHelmChart(
    celoEnv,
    releaseName,
    helmChartPath,
    await helmParameters(imageTag),
    true,
    valuesEnvFile
  )
}

export async function removeHelmRelease(helmReleaseName: string, celoEnv: string) {
  await removeGenericHelmChart(helmReleaseName, celoEnv)
}

export async function upgradeHelmChart(celoEnv: string, helmReleaseName: string, imageTag: string) {
  console.info(`Upgrading helm release ${helmReleaseName}`)
  const params = await helmParameters(imageTag)
  await upgradeGenericHelmChart(
    celoEnv,
    helmReleaseName,
    helmChartPath,
    params,
    `values-${helmReleaseName}.yaml`
  )

  console.info(`Helm release ${helmReleaseName} upgrade successful`)
}

async function helmParameters(imageTag: string) {
  const currentGcloudAccount = await getCurrentGcloudAccount()
  const params = [
    `--set changeCause="Deployed ${imageTag} by ${currentGcloudAccount} on ${new Date().toISOString()}"`,
    `--set blockscout.image.tag=${imageTag}`,
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
apiVersion: networking.k8s.io/v1
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
        pathType: ImplementationSpecific
        backend:
          service:
            name: ${ingressName}-web
            port:
              number: 4000
      - path: /(graphql|graphiql|api)
        pathType: ImplementationSpecific
        backend:
          service:
            name: ${ingressName}-api
            port:
              number: 4000
      - path: /
        pathType: ImplementationSpecific
        backend:
          service:
            name: ${ingressName}-web
            port:
              number: 4000
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
