import fs from 'fs'
import { envVar, fetchEnv, fetchEnvOrFallback, isVmBased } from './env-utils'
import { installGenericHelmChart, removeGenericHelmChart } from './helm_deploy'
import { execCmdWithExitOnFailure, outputIncludes } from './utils'
import { getInternalTxNodeLoadBalancerIP } from './vm-testnet-utils'

export async function installHelmChart(
  celoEnv: string,
  releaseName: string,
  blockscoutDBUsername: string,
  blockscoutDBPassword: string,
  blockscoutDBConnectionName: string
) {
  return installGenericHelmChart(
    celoEnv,
    releaseName,
    '../helm-charts/blockscout',
    await helmParameters(
      celoEnv,
      blockscoutDBUsername,
      blockscoutDBPassword,
      blockscoutDBConnectionName
    )
  )
}

export async function removeHelmRelease(helmReleaseName: string) {
  await removeGenericHelmChart(helmReleaseName)
}

export async function upgradeHelmChart(
  celoEnv: string,
  helmReleaseName: string,
  blockscoutDBUsername: string,
  blockscoutDBPassword: string,
  blockscoutDBConnectionName: string
) {
  console.info(`Upgrading helm release ${helmReleaseName}`)
  const params = (
    await helmParameters(
      celoEnv,
      blockscoutDBUsername,
      blockscoutDBPassword,
      blockscoutDBConnectionName
    )
  ).join(' ')
  if (process.env.CELOTOOL_VERBOSE === 'true') {
    await execCmdWithExitOnFailure(
      `helm upgrade --debug --dry-run ${helmReleaseName} ../helm-charts/blockscout --namespace ${celoEnv} ${params}`
    )
  }
  await execCmdWithExitOnFailure(
    `helm upgrade ${helmReleaseName} ../helm-charts/blockscout --namespace ${celoEnv} ${params}`
  )
  console.info(`Helm release ${helmReleaseName} upgrade successful`)
}

async function helmParameters(
  celoEnv: string,
  blockscoutDBUsername: string,
  blockscoutDBPassword: string,
  blockscoutDBConnectionName: string
) {
  const privateNodes = parseInt(fetchEnv(envVar.PRIVATE_TX_NODES), 10)
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
    const txNodeLbIp = await getInternalTxNodeLoadBalancerIP(celoEnv)
    params.push(`--set blockscout.jsonrpc_http_url=http://${txNodeLbIp}:8545`)
    params.push(`--set blockscout.jsonrpc_ws_url=ws://${txNodeLbIp}:8546`)
  } else if (privateNodes > 0) {
    params.push(`--set blockscout.jsonrpc_http_url=http://tx-nodes-private:8545`)
    params.push(`--set blockscout.jsonrpc_http_url=ws://tx-nodes-private:8546`)
  } else {
    params.push(`--set blockscout.jsonrpc_http_url=http://tx-nodes:8545`)
    params.push(`--set blockscout.jsonrpc_http_url=ws://tx-nodes:8546`)
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
    kubernetes.io/tls-acme: "true"
  labels:
    app: blockscout
    chart: blockscout
  name: ${celoEnv}-blockscout-web-ingress
  namespace: ${celoEnv}
spec:
  rules:
  - host: ${celoEnv}-blockscout.${fetchEnv('CLUSTER_DOMAIN_NAME')}.org
    http:
      paths:
      - backend:
          serviceName: ${ingressName}-web
          servicePort: 4000
        path: /
  tls:
  - hosts:
    - ${celoEnv}-blockscout.${fetchEnv('CLUSTER_DOMAIN_NAME')}.org
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
