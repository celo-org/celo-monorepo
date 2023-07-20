import { concurrentMap } from '@celo/utils/lib/async'
import compareVersions from 'compare-versions'
import fs from 'fs'
import { entries, range } from 'lodash'
import os from 'os'
import path from 'path'
import sleep from 'sleep-promise'
import { GCPClusterConfig } from 'src/lib/k8s-cluster/gcp'
import stringHash from 'string-hash'
import { getKubernetesClusterRegion, switchToClusterFromEnv } from './cluster'
import {
  execCmd,
  execCmdWithExitOnFailure,
  outputIncludes,
  spawnCmd,
  spawnCmdWithExitOnFailure,
} from './cmd-utils'
import { envTypes, envVar, fetchEnv, fetchEnvOrFallback, monorepoRoot } from './env-utils'
import { ensureAuthenticatedGcloudAccount } from './gcloud_utils'
import { generateGenesisFromEnv } from './generate_utils'
import {
  buildGethAll,
  checkoutGethRepo,
  getEnodesWithExternalIPAddresses,
  retrieveBootnodeIPAddress,
} from './geth'
import { BaseClusterConfig, CloudProvider } from './k8s-cluster/base'
import { getStatefulSetReplicas, scaleResource } from './kubernetes'
import { installPrometheusIfNotExists } from './prometheus'
import {
  getGenesisBlockFromGoogleStorage,
  getProxiesPerValidator,
  getProxyName,
  uploadGenesisBlockToGoogleStorage,
} from './testnet-utils'
import { stringToBoolean } from './utils'

const generator = require('generate-password')

const CLOUDSQL_SECRET_NAME = 'blockscout-cloudsql-credentials'
const BACKUP_GCS_SECRET_NAME = 'backup-blockchain-credentials'
const TIMEOUT_FOR_LOAD_BALANCER_POLL = 1000 * 60 * 25 // 25 minutes
const LOAD_BALANCER_POLL_INTERVAL = 1000 * 10 // 10 seconds

const TESTNET_CHART_DIR = '../helm-charts/testnet'
export type HelmAction = 'install' | 'upgrade'

async function validateExistingCloudSQLInstance(instanceName: string) {
  await ensureAuthenticatedGcloudAccount()
  try {
    await execCmd(`gcloud sql instances describe ${instanceName}`)
  } catch (error) {
    console.error(`Cloud SQL DB ${instanceName} does not exist, bailing`)
    console.error(error)
    process.exit(1)
  }
}

async function failIfSecretMissing(secretName: string, namespace: string) {
  try {
    await execCmd(`kubectl get secret ${secretName} --namespace ${namespace}`)
  } catch (error) {
    console.error(
      `Couldn't retrieve service account secret, cluster is likely not setup correctly for deployment`
    )
    console.error(error)
    process.exit(1)
  }
}

async function copySecret(secretName: string, srcNamespace: string, destNamespace: string) {
  console.info(`Copying secret ${secretName} from namespace ${srcNamespace} to ${destNamespace}`)
  await execCmdWithExitOnFailure(`kubectl get secret ${secretName} --namespace ${srcNamespace} -o yaml |\
  grep -v creationTimestamp | grep -v resourceVersion | grep -v selfLink | grep -v uid |\
  sed 's/default/${destNamespace}/' | kubectl apply --namespace=${destNamespace} -f -`)
}

export async function createCloudSQLInstance(celoEnv: string, instanceName: string) {
  await ensureAuthenticatedGcloudAccount()
  console.info('Creating Cloud SQL database, this might take a minute or two ...')

  await failIfSecretMissing(CLOUDSQL_SECRET_NAME, 'default')

  try {
    await execCmd(`gcloud sql instances describe ${instanceName}`)
    // if we get to here, that means the instance already exists
    console.warn(
      `A Cloud SQL instance named ${instanceName} already exists, so in all likelihood you cannot deploy initial with ${instanceName}`
    )
  } catch (error: any) {
    if (
      error.message.trim() !==
      `Command failed: gcloud sql instances describe ${instanceName}\nERROR: (gcloud.sql.instances.describe) HTTPError 404: The Cloud SQL instance does not exist.`
    ) {
      console.error(error.message.trim())
      process.exit(1)
    }
  }

  // Quite often these commands timeout, but actually succeed anyway. By ignoring errors we allow them to be re-run.

  try {
    await execCmd(
      `gcloud sql instances create ${instanceName} --zone ${fetchEnv(
        envVar.KUBERNETES_CLUSTER_ZONE
      )} --database-version POSTGRES_9_6 --cpu 1 --memory 4G`
    )
  } catch (error: any) {
    console.error(error.message.trim())
  }

  const envType = fetchEnv(envVar.ENV_TYPE)
  if (envType !== envTypes.DEVELOPMENT) {
    try {
      await execCmdWithExitOnFailure(
        `gcloud sql instances create ${instanceName}-replica --master-instance-name=${instanceName} --zone ${fetchEnv(
          envVar.KUBERNETES_CLUSTER_ZONE
        )}`
      )
    } catch (error: any) {
      console.error(error.message.trim())
    }
  }

  await execCmdWithExitOnFailure(
    `gcloud sql instances patch ${instanceName} --backup-start-time 17:00`
  )

  const passwordOptions = {
    length: 22,
    numbers: true,
    symbols: false,
    lowercase: true,
    uppercase: true,
    strict: true,
  }

  const blockscoutDBUsername = generator.generate(passwordOptions)
  const blockscoutDBPassword = generator.generate(passwordOptions)

  console.info('Creating SQL user')
  await execCmdWithExitOnFailure(
    `gcloud sql users create ${blockscoutDBUsername} -i ${instanceName} --password ${blockscoutDBPassword}`
  )

  console.info('Creating blockscout database')
  await execCmdWithExitOnFailure(`gcloud sql databases create blockscout -i ${instanceName}`)

  console.info('Copying blockscout service account secret to namespace')
  await copySecret(CLOUDSQL_SECRET_NAME, 'default', celoEnv)

  const [blockscoutDBConnectionName] = await execCmdWithExitOnFailure(
    `gcloud sql instances describe ${instanceName} --format="value(connectionName)"`
  )

  return [blockscoutDBUsername, blockscoutDBPassword, blockscoutDBConnectionName.trim()]
}

export async function cloneCloudSQLInstance(
  celoEnv: string,
  instanceName: string,
  cloneInstanceName: string,
  dbSuffix: string
) {
  await ensureAuthenticatedGcloudAccount()
  console.info('Cloning Cloud SQL database, this might take a minute or two ...')

  await failIfSecretMissing(CLOUDSQL_SECRET_NAME, 'default')

  try {
    await execCmd(`gcloud sql instances describe ${cloneInstanceName}`)
    // if we get to here, that means the instance already exists
    console.warn(
      `A Cloud SQL instance named ${cloneInstanceName} already exists, so in all likelihood you cannot deploy cloning with ${cloneInstanceName}`
    )
  } catch (error: any) {
    if (
      error.message.trim() !==
      `Command failed: gcloud sql instances describe ${cloneInstanceName}\nERROR: (gcloud.sql.instances.describe) HTTPError 404: The Cloud SQL instance does not exist.`
    ) {
      console.error(error.message.trim())
      process.exit(1)
    }
  }

  try {
    await execCmdWithExitOnFailure(
      `gcloud sql instances clone ${instanceName} ${cloneInstanceName} `
    )
  } catch (error: any) {
    console.error(error.message.trim())
  }

  await execCmdWithExitOnFailure(
    `gcloud sql instances patch ${cloneInstanceName} --backup-start-time 17:00`
  )

  const [blockscoutDBUsername, blockscoutDBPassword] = await retrieveCloudSQLConnectionInfo(
    celoEnv,
    instanceName,
    dbSuffix
  )

  console.info('Copying blockscout service account secret to namespace')
  await copySecret(CLOUDSQL_SECRET_NAME, 'default', celoEnv)

  const [blockscoutDBConnectionName] = await execCmdWithExitOnFailure(
    `gcloud sql instances describe ${cloneInstanceName} --format="value(connectionName)"`
  )

  return [blockscoutDBUsername, blockscoutDBPassword, blockscoutDBConnectionName.trim()]
}

export async function createSecretInSecretManagerIfNotExists(
  secretId: string,
  secretLabels: string[],
  secretValue: string
) {
  try {
    await execCmd(`gcloud secrets describe ${secretId}`)

    console.info(`Secret ${secretId} already exists, skipping creation...`)
  } catch (error) {
    await execCmd(
      `echo -n "${secretValue}" | gcloud secrets create ${secretId} --data-file=- --replication-policy="automatic" --labels ${secretLabels.join(
        ','
      )}`
    )
  }
}

export async function deleteSecretFromSecretManager(secretId: string) {
  try {
    await execCmd(`gcloud secrets delete ${secretId}`)
  } catch {
    console.info(`Couldn't delete secret ${secretId} -- skipping`)
  }
}

async function createAndUploadKubernetesSecretIfNotExists(
  secretName: string,
  serviceAccountName: string,
  celoEnv: string
) {
  await switchToClusterFromEnv(celoEnv)
  const keyfilePath = `/tmp/${serviceAccountName}_key.json`
  const secretExists = await outputIncludes(
    `kubectl get secrets`,
    secretName,
    `secret exists, skipping creation: ${secretName}`
  )
  if (!secretExists) {
    console.info(`Creating secret ${secretName}`)
    await execCmdWithExitOnFailure(
      `gcloud iam service-accounts keys create ${keyfilePath} --iam-account ${serviceAccountName}@${fetchEnv(
        envVar.TESTNET_PROJECT_NAME
      )}.iam.gserviceaccount.com`
    )
    await execCmdWithExitOnFailure(
      `kubectl create secret generic ${secretName} --from-file=credentials.json=${keyfilePath}`
    )
  }
}

export async function createAndUploadCloudSQLSecretIfNotExists(
  serviceAccountName: string,
  celoEnv: string
) {
  return createAndUploadKubernetesSecretIfNotExists(
    CLOUDSQL_SECRET_NAME,
    serviceAccountName,
    celoEnv
  )
}

export async function createAndUploadBackupSecretIfNotExists(
  serviceAccountName: string,
  celoEnv: string
) {
  return createAndUploadKubernetesSecretIfNotExists(
    BACKUP_GCS_SECRET_NAME,
    serviceAccountName,
    celoEnv
  )
}

export function getServiceAccountName(prefix: string) {
  // NOTE: trim to meet the max size requirements of service account names
  return `${prefix}-${fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)}`.slice(0, 30)
}

export async function installGCPSSDStorageClass() {
  // A previous version installed this directly with `kubectl` instead of helm.
  // To be backward compatible, we don't install the chart if the storage class
  // already exists.
  const storageClassExists = await outputIncludes(
    `kubectl get storageclass`,
    `ssd`,
    `SSD StorageClass exists, skipping install`
  )
  if (!storageClassExists) {
    const gcpSSDHelmChartPath = '../helm-charts/gcp-ssd'
    await execCmdWithExitOnFailure(`helm upgrade -i gcp-ssd ${gcpSSDHelmChartPath}`)
  }
}

export async function installCertManagerAndNginx(
  celoEnv: string,
  clusterConfig?: BaseClusterConfig
) {
  const nginxChartVersion = '4.2.1'
  const nginxChartNamespace = 'default'

  // Check if cert-manager is installed in any namespace
  // because cert-manager crds are global and cannot live
  // different crds version in the same cluster
  const certManagerExists =
    (await outputIncludes(`helm list -n default`, `cert-manager-cluster-issuers`)) ||
    (await outputIncludes(`helm list -n cert-manager`, `cert-manager-cluster-issuers`))

  if (certManagerExists) {
    console.info('cert-manager-cluster-issuers exists, skipping install')
  } else {
    await installCertManager()
  }

  const nginxIngressReleaseExists = await outputIncludes(
    `helm list -n default`,
    `nginx-ingress-release`,
    `nginx-ingress-release exists, skipping install`
  )
  if (!nginxIngressReleaseExists) {
    const valueFilePath = `/tmp/${celoEnv}-nginx-testnet-values.yaml`
    await nginxHelmParameters(valueFilePath, celoEnv, clusterConfig)

    await helmAddAndUpdateRepos()
    await execCmdWithExitOnFailure(`helm install \
      -n ${nginxChartNamespace} \
      --version ${nginxChartVersion} \
      nginx-ingress-release ingress-nginx/ingress-nginx \
      -f ${valueFilePath}
    `)
  }
}

async function nginxHelmParameters(
  valueFilePath: string,
  celoEnv: string,
  clusterConfig?: BaseClusterConfig
) {
  const logFormat = `{"timestamp": "$time_iso8601", "requestID": "$req_id", "proxyUpstreamName":
  "$proxy_upstream_name", "proxyAlternativeUpstreamName": "$proxy_alternative_upstream_name","upstreamStatus":
  "$upstream_status", "upstreamAddr": "$upstream_addr","httpRequest":{"requestMethod":
  "$request_method", "requestUrl": "$host$request_uri", "status": $status,"requestSize":
  "$request_length", "responseSize": "$upstream_response_length", "userAgent":
  "$http_user_agent", "remoteIp": "$remote_addr", "referer": "$http_referer",
  "latency": "$upstream_response_time s", "protocol":"$server_protocol"}}`

  let loadBalancerIP = ''
  if (clusterConfig == null || clusterConfig?.cloudProvider === CloudProvider.GCP) {
    loadBalancerIP = await getOrCreateNginxStaticIp(celoEnv, clusterConfig)
  }

  const valueFileContent = `
controller:
  autoscaling:
    enabled: "true"
    minReplicas: 1
    maxReplicas: 10
    targetCPUUtilizationPercentage: 80
    targetMemoryUtilizationPercentage: 80
  config:
    log-format-escape-json: "true"
    log-format-upstream: '${logFormat}'
  metrics:
    enabled: "true"
    service:
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "10254"
  service:
    loadBalancerIP: ${loadBalancerIP}
  resources:
    requests:
      cpu: 300m
      memory: 600Mi
`
  fs.writeFileSync(valueFilePath, valueFileContent)
}

async function getOrCreateNginxStaticIp(celoEnv: string, clusterConfig?: BaseClusterConfig) {
  const staticIpName = clusterConfig?.clusterName
    ? `${clusterConfig?.clusterName}-nginx`
    : `${celoEnv}-nginx`
  let staticIpAddress
  if (clusterConfig !== undefined && clusterConfig.hasOwnProperty('zone')) {
    const zone = (clusterConfig as GCPClusterConfig).zone
    await registerIPAddress(staticIpName, zone)
    staticIpAddress = await retrieveIPAddress(staticIpName, zone)
  } else {
    await registerIPAddress(staticIpName)
    staticIpAddress = await retrieveIPAddress(staticIpName)
  }
  console.info(`nginx-ingress static ip --> ${staticIpName}: ${staticIpAddress}`)
  return staticIpAddress
}

// Add a Helm repository and updates the local cache. If repository already exists, it is executed
// without error.
export async function helmAddRepoAndUpdate(repository: string, name?: string) {
  if (name === undefined) {
    const repoArray = repository.split('/')
    name = repoArray[repoArray.length - 1]
  }
  console.info(`Adding Helm repository ${name} with URL ${repository}`)
  await execCmdWithExitOnFailure(`helm repo add ${name} ${repository}`)
  await execCmdWithExitOnFailure(`helm repo update`)
}

// Add common helm repositories
export async function helmAddAndUpdateRepos() {
  await helmAddRepoAndUpdate('https://kubernetes.github.io/ingress-nginx')
  await helmAddRepoAndUpdate('https://charts.helm.sh/stable')
  await execCmdWithExitOnFailure(`helm repo update`)
}

export async function installCertManager() {
  const clusterIssuersHelmChartPath = `../helm-charts/cert-manager-cluster-issuers`

  console.info('Create the namespace for cert-manager')
  await execCmdWithExitOnFailure(`kubectl create namespace cert-manager`)

  console.info('Installing cert-manager CustomResourceDefinitions')
  await execCmdWithExitOnFailure(
    `kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.9.1/cert-manager.crds.yaml`
  )
  console.info('Updating cert-manager-cluster-issuers chart dependencies')
  await execCmdWithExitOnFailure(`helm dependency update ${clusterIssuersHelmChartPath}`)
  console.info('Installing cert-manager-cluster-issuers')
  await execCmdWithExitOnFailure(
    `helm install cert-manager-cluster-issuers ${clusterIssuersHelmChartPath} -n cert-manager`
  )
}

export async function installAndEnableMetricsDeps(
  installPrometheus: boolean,
  context?: string,
  clusterConfig?: BaseClusterConfig
) {
  const kubeStateMetricsReleaseExists = await outputIncludes(
    `helm list -n default`,
    `kube-state-metrics`,
    `kube-state-metrics exists, skipping install`
  )
  if (!kubeStateMetricsReleaseExists) {
    await execCmdWithExitOnFailure(
      `helm install kube-state-metrics stable/kube-state-metrics --set rbac.create=true -n default`
    )
  }
  if (installPrometheus) {
    await installPrometheusIfNotExists(context, clusterConfig)
  }
}

export async function grantRoles(serviceAccountName: string, role: string) {
  const projectName = fetchEnv(envVar.TESTNET_PROJECT_NAME)

  const serviceAccountFullName = `${serviceAccountName}@${projectName}.iam.gserviceaccount.com`
  const commandRolesAlreadyGranted = `gcloud projects get-iam-policy ${projectName}  \
  --flatten="bindings[].members" \
  --format='table(bindings.role)' \
  --filter="bindings.members:serviceAccount:${serviceAccountFullName}"`
  const rolesAlreadyGranted = await outputIncludes(
    commandRolesAlreadyGranted,
    role,
    `Role ${role} already granted for account ${serviceAccountFullName}, skipping binding`
  )
  if (!rolesAlreadyGranted) {
    const cmd =
      `gcloud projects add-iam-policy-binding ${projectName} ` +
      `--role=${role} ` +
      `--member=serviceAccount:${serviceAccountFullName}`
    await execCmd(cmd)
  }
  return
}

export async function retrieveCloudSQLConnectionInfo(
  celoEnv: string,
  instanceName: string,
  dbSuffix: string
) {
  await validateExistingCloudSQLInstance(instanceName)
  const secretName = `${celoEnv}-blockscout${dbSuffix}`
  const [blockscoutDBUsername] = await execCmdWithExitOnFailure(
    `kubectl get secret ${secretName} -o jsonpath='{.data.DATABASE_USER}' -n ${celoEnv} | base64 --decode`
  )
  const [blockscoutDBPassword] = await execCmdWithExitOnFailure(
    `kubectl get secret ${secretName} -o jsonpath='{.data.DATABASE_PASSWORD}' -n ${celoEnv} | base64 --decode`
  )
  const [blockscoutDBConnectionName] = await execCmdWithExitOnFailure(
    `gcloud sql instances describe ${instanceName} --format="value(connectionName)"`
  )

  return [blockscoutDBUsername, blockscoutDBPassword, blockscoutDBConnectionName.trim()]
}

export async function deleteCloudSQLInstance(
  instanceName: string
): Promise<[string, string, string]> {
  console.info(`Deleting Cloud SQL instance ${instanceName}, this might take a minute or two ...`)
  try {
    await execCmd(`gcloud sql instances delete ${instanceName} --quiet`)
  } catch {
    console.info(`Couldn't delete Cloud SQL instance ${instanceName} -- skipping`)
  }
  return ['', '', '']
}

export async function resetCloudSQLInstance(instanceName: string) {
  await validateExistingCloudSQLInstance(instanceName)

  console.info('Deleting blockscout database from instance')
  await execCmdWithExitOnFailure(
    `gcloud sql databases delete blockscout -i ${instanceName} --quiet`
  )

  console.info('Creating blockscout database')
  await execCmdWithExitOnFailure(`gcloud sql databases create blockscout -i ${instanceName}`)
}

export async function registerIPAddress(name: string, zone?: string) {
  console.info(`Registering IP address ${name}`)
  try {
    await execCmd(
      `gcloud compute addresses create ${name} --region ${getKubernetesClusterRegion(zone)}`
    )
  } catch (error: any) {
    if (!error.toString().includes('already exists')) {
      console.error(error)
      process.exit(1)
    }
  }
}

export async function deleteIPAddress(name: string, zone?: string) {
  console.info(`Deleting IP address ${name}`)
  try {
    if (isCelotoolVerbose()) {
      console.info(`IP Address ${name} would be deleted`)
    } else {
      await execCmd(
        `gcloud compute addresses delete ${name} --region ${getKubernetesClusterRegion(zone)} -q`
      )
    }
  } catch (error: any) {
    if (!error.toString().includes('was not found')) {
      console.error(error)
      process.exit(1)
    }
  }
}

export async function retrieveIPAddress(name: string, zone?: string) {
  const regionFlag = zone === 'global' ? '--global' : `--region ${getKubernetesClusterRegion(zone)}`
  const [address] = await execCmdWithExitOnFailure(
    `gcloud compute addresses describe ${name} ${regionFlag} --format="value(address)"`
  )
  return address.replace(/\n*$/, '')
}

export async function retrieveIPAddresses(prefix: string, zone?: string) {
  const [address] = await execCmdWithExitOnFailure(
    `gcloud compute addresses list --filter="name~'${prefix}-' AND name!~'${prefix}-private-' AND region:( ${getKubernetesClusterRegion(
      zone
    )} )" --format="value(name)"`
  )
  return address.split('\n')
}

// returns the IP address of a resource internal to the cluster (ie 10.X.X.X)
export async function retrieveClusterIPAddress(
  resourceType: string,
  resourceName: string,
  namespace: string
) {
  const [address] = await execCmdWithExitOnFailure(
    `kubectl get ${resourceType} ${resourceName} -n ${namespace} -o jsonpath={.spec.clusterIP}`
  )
  return address
}

export async function createStaticIPs(celoEnv: string) {
  console.info(`Creating static IPs for ${celoEnv}`)

  const numTxNodes = parseInt(fetchEnv(envVar.TX_NODES), 10)
  await concurrentMap(5, range(numTxNodes), (i) => registerIPAddress(`${celoEnv}-tx-nodes-${i}`))

  if (useStaticIPsForGethNodes()) {
    await registerIPAddress(`${celoEnv}-bootnode`)

    const validatorCount = parseInt(fetchEnv(envVar.VALIDATORS), 10)
    const proxiesPerValidator = getProxiesPerValidator()
    // only create IPs for validators that are not proxied
    for (let i = 0; i < validatorCount; i++) {
      if (proxiesPerValidator[i] === 0) {
        await registerIPAddress(`${celoEnv}-validators-${i}`)
      }
    }

    // and create IPs for all the proxies
    let validatorIndex = 0
    for (const proxyCount of proxiesPerValidator) {
      for (let i = 0; i < proxyCount; i++) {
        await registerIPAddress(getProxyName(celoEnv, validatorIndex, i))
      }
      validatorIndex++
    }

    // Create IPs for the private tx nodes
    const numPrivateTxNodes = parseInt(fetchEnv(envVar.PRIVATE_TX_NODES), 10)
    await concurrentMap(5, range(numPrivateTxNodes), (i) =>
      registerIPAddress(`${celoEnv}-tx-nodes-private-${i}`)
    )
  }
}

export async function upgradeStaticIPs(celoEnv: string) {
  const newTxNodeCount = parseInt(fetchEnv(envVar.TX_NODES), 10)
  await upgradeNodeTypeStaticIPs(celoEnv, 'tx-nodes', newTxNodeCount)

  if (useStaticIPsForGethNodes()) {
    const prevValidatorNodeCount = await getStatefulSetReplicas(celoEnv, `${celoEnv}-validators`)
    const newValidatorNodeCount = parseInt(fetchEnv(envVar.VALIDATORS), 10)
    await upgradeValidatorStaticIPs(celoEnv, prevValidatorNodeCount, newValidatorNodeCount)

    const proxiesPerValidator = getProxiesPerValidator()
    // Iterate through all validators and check to see if there are changes in proxies
    const higherValidatorCount = Math.max(prevValidatorNodeCount, newValidatorNodeCount)
    for (let i = 0; i < higherValidatorCount; i++) {
      const proxyCount = proxiesPerValidator[i]
      await upgradeNodeTypeStaticIPs(celoEnv, `validators-${i}-proxy`, proxyCount)
    }

    const newPrivateTxNodeCount = parseInt(fetchEnv(envVar.PRIVATE_TX_NODES), 10)
    await upgradeNodeTypeStaticIPs(celoEnv, 'tx-nodes-private', newPrivateTxNodeCount)
  }
}

async function upgradeValidatorStaticIPs(
  celoEnv: string,
  prevValidatorNodeCount: number,
  newValidatorNodeCount: number
) {
  const proxiesPerValidator = getProxiesPerValidator()

  // Iterate through each validator & create or destroy
  // IP addresses as necessary. If a validator has a 1+ proxies,
  // the validator do not have a static IP. If the validator has
  // no proxy, then the validator needs a static ip.
  const higherValidatorCount = Math.max(prevValidatorNodeCount, newValidatorNodeCount)
  for (let i = 0; i < higherValidatorCount; i++) {
    const ipName = `${celoEnv}-validators-${i}`
    let ipExists
    try {
      await retrieveIPAddress(ipName)
      ipExists = true
    } catch (e) {
      ipExists = false
    }
    const proxiedValidator = proxiesPerValidator[i] === 0 ? false : true
    if (ipExists && proxiedValidator) {
      await deleteIPAddress(ipName)
    } else if (!ipExists && !proxiedValidator) {
      await registerIPAddress(ipName)
    }
  }
}

async function upgradeNodeTypeStaticIPs(celoEnv: string, nodeType: string, newNodeCount: number) {
  const existingAddresses = await retrieveIPAddresses(`${celoEnv}-${nodeType}`)
  const desiredAddresses = range(0, newNodeCount).map((i) => `${celoEnv}-${nodeType}-${i}`)
  const addressesToCreate = desiredAddresses.filter((a) => !existingAddresses.includes(a))
  const addressesToDelete = existingAddresses.filter((a) => !desiredAddresses.includes(a))

  for (const address of addressesToCreate) {
    if (address) {
      await registerIPAddress(address)
    }
  }

  for (const address of addressesToDelete) {
    if (address) {
      await deleteIPAddress(address)
    }
  }
}

export async function pollForBootnodeLoadBalancer(celoEnv: string) {
  if (!useStaticIPsForGethNodes()) {
    return
  }
  console.info(`Poll for bootnode load balancer`)
  let totalTime = 0

  while (true) {
    const [rules] = await execCmdWithExitOnFailure(
      `gcloud compute addresses describe ${celoEnv}-bootnode --region ${getKubernetesClusterRegion()} --format="value(users.len())"`
    )

    if (parseInt(rules, 10) > 0) {
      break
    }

    totalTime += LOAD_BALANCER_POLL_INTERVAL
    if (totalTime > TIMEOUT_FOR_LOAD_BALANCER_POLL) {
      console.error(
        `\nCould not detect the bootnode's load balancer provisioning, which will likely cause the peers on the network unable to connect`
      )
      process.exit(1)
    }

    process.stdout.write('.')
    await sleep(LOAD_BALANCER_POLL_INTERVAL)
  }

  console.info('Sleeping 1 minute...')
  await sleep(1000 * 60) // 1 minute

  console.info(`\nReset all pods now that the bootnode load balancer has provisioned`)
  await execCmdWithExitOnFailure(`kubectl delete pod -n ${celoEnv} --selector=component=validators`)
  await execCmdWithExitOnFailure(`kubectl delete pod -n ${celoEnv} --selector=component=tx_nodes`)
  await execCmdWithExitOnFailure(`kubectl delete pod -n ${celoEnv} --selector=component=proxy`)
  return
}

export async function deleteStaticIPs(celoEnv: string) {
  console.info(`Deleting static IPs for ${celoEnv}`)

  const numTxNodes = parseInt(fetchEnv(envVar.TX_NODES), 10)
  await concurrentMap(5, range(numTxNodes), (i) => deleteIPAddress(`${celoEnv}-tx-nodes-${i}`))

  await deleteIPAddress(`${celoEnv}-bootnode`)

  const numValidators = parseInt(fetchEnv(envVar.VALIDATORS), 10)
  await concurrentMap(5, range(numValidators), (i) => deleteIPAddress(`${celoEnv}-validators-${i}`))

  const proxiesPerValidator = getProxiesPerValidator()
  for (let valIndex = 0; valIndex < numValidators; valIndex++) {
    for (let proxyIndex = 0; proxyIndex < proxiesPerValidator[valIndex]; proxyIndex++) {
      await deleteIPAddress(getProxyName(celoEnv, valIndex, proxyIndex))
    }
  }

  const numPrivateTxNodes = parseInt(fetchEnv(envVar.PRIVATE_TX_NODES), 10)
  await concurrentMap(5, range(numPrivateTxNodes), (i) =>
    deleteIPAddress(`${celoEnv}-tx-nodes-private-${i}`)
  )
}

export async function deletePersistentVolumeClaims(celoEnv: string, componentLabels: string[]) {
  for (const component of componentLabels) {
    await deletePersistentVolumeClaimsCustomLabels(celoEnv, 'component', component)
  }
}

export async function deletePersistentVolumeClaimsCustomLabels(
  namespace: string,
  label: string,
  value: string
) {
  console.info(
    `Deleting persistent volume claims for labels ${label}=${value} in namespace ${namespace}`
  )
  try {
    const [output] = await execCmd(
      `kubectl delete pvc --selector='${label}=${value}' --namespace ${namespace}`
    )
    console.info(output)
  } catch (error: any) {
    console.error(error)
    if (!error.toString().includes('not found')) {
      process.exit(1)
    }
  }
}

async function helmIPParameters(celoEnv: string) {
  const ipAddressParameters: string[] = [
    `--set geth.static_ips=${fetchEnv(envVar.STATIC_IPS_FOR_GETH_NODES)}`,
  ]

  const numTxNodes = parseInt(fetchEnv(envVar.TX_NODES), 10)

  const txAddresses = await concurrentMap(5, range(numTxNodes), (i) =>
    retrieveIPAddress(`${celoEnv}-tx-nodes-${i}`)
  )

  // Tx-node IPs
  const txNodeIpParams = setHelmArray('geth.txNodesIPAddressArray', txAddresses)
  ipAddressParameters.push(...txNodeIpParams)

  if (useStaticIPsForGethNodes()) {
    ipAddressParameters.push(
      `--set geth.bootnodeIpAddress=${await retrieveBootnodeIPAddress(celoEnv)}`
    )

    // Validator IPs
    const numValidators = parseInt(fetchEnv(envVar.VALIDATORS), 10)
    const proxiesPerValidator = getProxiesPerValidator()
    // This tracks validator IP addresses for each corresponding validator. If the validator
    // is proxied, there is no public IP address, so it's set as an empty string
    const validatorIpAddresses = []
    for (let i = 0; i < numValidators; i++) {
      if (proxiesPerValidator[i] > 0) {
        // Then this validator is proxied
        validatorIpAddresses.push('')
      } else {
        validatorIpAddresses.push(await retrieveIPAddress(`${celoEnv}-validators-${i}`))
      }
    }
    const validatorIpParams = setHelmArray('geth.validatorsIPAddressArray', validatorIpAddresses)
    ipAddressParameters.push(...validatorIpParams)

    // Proxy IPs
    // Helm ran into issues when dealing with 2-d lists,
    // so each index corresponds to a particular validator.
    // Multiple proxy IPs for a single validator are separated by '/'
    const proxyIpAddressesPerValidator = []
    let validatorIndex = 0
    for (const proxyCount of proxiesPerValidator) {
      const proxyIpAddresses = []
      for (let i = 0; i < proxyCount; i++) {
        proxyIpAddresses.push(await retrieveIPAddress(getProxyName(celoEnv, validatorIndex, i)))
      }
      const listOfProxyIpAddresses = proxyIpAddresses.join('/')
      proxyIpAddressesPerValidator.push(listOfProxyIpAddresses)

      validatorIndex++
    }

    const proxyIpAddressesParams = setHelmArray(
      'geth.proxyIPAddressesPerValidatorArray',
      proxyIpAddressesPerValidator
    )
    ipAddressParameters.push(...proxyIpAddressesParams)

    const numPrivateTxNodes = parseInt(fetchEnv(envVar.PRIVATE_TX_NODES), 10)
    const privateTxAddresses = await concurrentMap(5, range(numPrivateTxNodes), (i) =>
      retrieveIPAddress(`${celoEnv}-tx-nodes-private-${i}`)
    )
    const privateTxAddressParameters = privateTxAddresses.map(
      (address, i) => `--set geth.private_tx_nodes_${i}IpAddress=${address}`
    )
    ipAddressParameters.push(...privateTxAddressParameters)
    const listOfPrivateTxNodeAddresses = privateTxAddresses.join(',')
    ipAddressParameters.push(
      `--set geth.private_tx_node_ip_addresses='{${listOfPrivateTxNodeAddresses}}'`
    )
  }

  return ipAddressParameters
}

async function helmParameters(celoEnv: string, useExistingGenesis: boolean) {
  const valueFilePath = `/tmp/${celoEnv}-testnet-values.yaml`
  await saveHelmValuesFile(celoEnv, valueFilePath, useExistingGenesis, false)

  const gethMetricsOverrides =
    fetchEnvOrFallback('GETH_ENABLE_METRICS', 'false') === 'true'
      ? [
          `--set metrics="true"`,
          `--set pprof.enabled="true"`,
          `--set pprof.path="/debug/metrics/prometheus"`,
          `--set pprof.port="6060"`,
        ]
      : [`--set metrics="false"`, `--set pprof.enabled="false"`]

  const useMyCelo = stringToBoolean(fetchEnvOrFallback(envVar.GETH_USE_MYCELO, 'false'))
  await createAndPushGenesis(celoEnv, !useExistingGenesis, useMyCelo)

  const bootnodeOverwritePkey =
    fetchEnvOrFallback(envVar.GETH_BOOTNODE_OVERWRITE_PKEY, '') !== ''
      ? [
          `--set geth.overwriteBootnodePrivateKey="true"`,
          `--set geth.bootnodePrivateKey="${fetchEnv(envVar.GETH_BOOTNODE_OVERWRITE_PKEY)}"`,
        ]
      : [`--set geth.overwriteBootnodePrivateKey="false"`]

  const defaultDiskSize = fetchEnvOrFallback(envVar.NODE_DISK_SIZE_GB, '10')
  const privateTxNodeDiskSize = fetchEnvOrFallback(
    envVar.PRIVATE_NODE_DISK_SIZE_GB,
    defaultDiskSize
  )

  return [
    `-f ${valueFilePath}`,
    `--set bootnode.image.repository=${fetchEnv('GETH_BOOTNODE_DOCKER_IMAGE_REPOSITORY')}`,
    `--set bootnode.image.tag=${fetchEnv('GETH_BOOTNODE_DOCKER_IMAGE_TAG')}`,
    `--set celotool.image.repository=${fetchEnv('CELOTOOL_DOCKER_IMAGE_REPOSITORY')}`,
    `--set celotool.image.tag=${fetchEnv('CELOTOOL_DOCKER_IMAGE_TAG')}`,
    `--set domain.name=${fetchEnv('CLUSTER_DOMAIN_NAME')}`,
    `--set genesis.useGenesisFileBase64="false"`,
    `--set genesis.network=${celoEnv}`,
    `--set genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set geth.verbosity=${fetchEnvOrFallback('GETH_VERBOSITY', '4')}`,
    `--set geth.vmodule=${fetchEnvOrFallback('GETH_VMODULE', '')}`,
    `--set geth.resources.requests.cpu=${fetchEnv('GETH_NODE_CPU_REQUEST')}`,
    `--set geth.resources.requests.memory=${fetchEnv('GETH_NODE_MEMORY_REQUEST')}`,
    `--set geth.image.repository=${fetchEnv('GETH_NODE_DOCKER_IMAGE_REPOSITORY')}`,
    `--set geth.image.tag=${fetchEnv('GETH_NODE_DOCKER_IMAGE_TAG')}`,
    `--set geth.validators="${fetchEnv('VALIDATORS')}"`,
    `--set geth.secondaries="${fetchEnvOrFallback('SECONDARIES', '0')}"`,
    `--set geth.use_gstorage_data=${fetchEnvOrFallback('USE_GSTORAGE_DATA', 'false')}`,
    `--set geth.gstorage_data_bucket=${fetchEnvOrFallback('GSTORAGE_DATA_BUCKET', '')}`,
    `--set geth.faultyValidators="${fetchEnvOrFallback('FAULTY_VALIDATORS', '0')}"`,
    `--set geth.faultyValidatorType="${fetchEnvOrFallback('FAULTY_VALIDATOR_TYPE', '0')}"`,
    `--set geth.tx_nodes="${fetchEnv('TX_NODES')}"`,
    `--set geth.private_tx_nodes="${fetchEnv(envVar.PRIVATE_TX_NODES)}"`,
    `--set geth.ssd_disks="${fetchEnvOrFallback(envVar.GETH_NODES_SSD_DISKS, 'true')}"`,
    `--set geth.account.secret="${fetchEnv('GETH_ACCOUNT_SECRET')}"`,
    `--set geth.ping_ip_from_packet=${fetchEnvOrFallback('PING_IP_FROM_PACKET', 'false')}`,
    `--set geth.in_memory_discovery_table=${fetchEnvOrFallback(
      'IN_MEMORY_DISCOVERY_TABLE',
      'false'
    )}`,
    `--set geth.diskSizeGB=${defaultDiskSize}`,
    `--set geth.privateTxNodediskSizeGB=${privateTxNodeDiskSize}`,
    `--set mnemonic="${fetchEnv('MNEMONIC')}"`,
    ...setHelmArray('geth.proxiesPerValidator', getProxiesPerValidator()),
    ...gethMetricsOverrides,
    ...bootnodeOverwritePkey,
    ...rollingUpdateHelmVariables(),
    ...(await helmIPParameters(celoEnv)),
  ]
}

async function helmCommand(command: string, pipeOutput = false) {
  // "helm diff" is a plugin and doesn't support "--debug"
  if (isCelotoolVerbose() && !command.startsWith('helm diff')) {
    command += ' --debug'
  }

  await execCmdWithExitOnFailure(command, {}, pipeOutput)
}

function buildHelmChartDependencies(chartDir: string) {
  console.info(`Building any chart dependencies...`)
  return helmCommand(`helm dep build ${chartDir}`)
}

export async function installHelmDiffPlugin() {
  try {
    await execCmd(`helm diff version`, {}, false)
  } catch (error) {
    console.info(`Installing helm-diff plugin...`)
    await execCmdWithExitOnFailure(`helm plugin install https://github.com/databus23/helm-diff`)
  }
}

// Return the values file arg if file exists If values file reference is defined and file not found,
// throw an error. When chartDir is a remote chart, the values file is assumed to be an abslute path.
function valuesOverrideArg(chartDir: string, filename: string | undefined) {
  if (filename === undefined) {
    return ''
  } else if (fs.existsSync(filename)) {
    return `-f ${filename}`
  } else if (fs.existsSync(path.join(chartDir, filename))) {
    return `-f ${path.join(chartDir, filename)}`
  } else {
    console.error(`Values override file ${filename} not found`)
  }
}

//   namespace: The namespace to install the chart into
//   releaseName: The name of the release
//   chartDir: The directory containing the chart or the values.yamls files. By default, it will try to use a custom values file
//       at ${chartDir}/${valuesOverrideFile}.yaml
//   parameters: The parameters to pass to the helm install command (e.g. --set geth.replicas=3)
//   buildDependencies: Whether to build the chart dependencies before installing. When using a remote chart, this must be false.
//   chartVersion: The version of the chart to install. Used only when chartRemoteReference is set
//   valuesOverrideFile: The name of the values file to use. In the case of a remote chart, this is assumed to be an absolute path.
interface GenericHelmChartParameters {
  namespace: string
  releaseName: string
  chartDir: string
  parameters: string[]
  buildDependencies?: boolean
  chartVersion?: string
  valuesOverrideFile?: string
}
// Install a Helm Chart. Look above for the parameters

// When using a remote helm chart, buildDependencies must be false and valuesOverrideFile the absolute path to the values file
export async function installGenericHelmChart({
  namespace,
  releaseName,
  chartDir,
  parameters,
  buildDependencies = true,
  chartVersion,
  valuesOverrideFile,
}: GenericHelmChartParameters) {
  if (buildDependencies) {
    await buildHelmChartDependencies(chartDir)
  }

  if (isCelotoolHelmDryRun()) {
    const versionLog = chartVersion ? ` version ${chartVersion}` : ''
    const valuesOverrideLog = valuesOverrideFile
      ? `, with values override: ${valuesOverrideFile}`
      : ''
    console.info(
      `This would deploy chart ${chartDir}${versionLog} with release name ${releaseName} in namespace ${namespace}${valuesOverrideLog} with parameters:`
    )
    console.info(parameters)
  } else {
    console.info(`Installing helm release ${releaseName}`)
    const versionArg = chartVersion ? `--version=${chartVersion}` : ''
    const valuesOverride = valuesOverrideArg(chartDir, valuesOverrideFile)
    await helmCommand(
      `helm upgrade --install ${valuesOverride} ${releaseName} ${chartDir} ${versionArg} --namespace ${namespace} ${parameters.join(
        ' '
      )}`
    )
  }
}

// Upgrade a Helm Chart. chartDir can be the path to the Helm Chart or the name of a remote Helm Chart.
// If using a remote helm chart, the chart repository has to be added and updated in the local helm config
// When using a remote helm chart, buildDependencies must be false and valuesOverrideFile the absolute path to the values file
export async function upgradeGenericHelmChart({
  namespace,
  releaseName,
  chartDir,
  parameters,
  buildDependencies = true,
  chartVersion,
  valuesOverrideFile,
}: GenericHelmChartParameters) {
  if (buildDependencies) {
    await buildHelmChartDependencies(chartDir)
  }
  const valuesOverride = valuesOverrideArg(chartDir, valuesOverrideFile)
  const versionArg = chartVersion ? `--version=${chartVersion}` : ''

  if (isCelotoolHelmDryRun()) {
    console.info(
      `Simulating the upgrade of helm release ${releaseName}. No output means no change in the helm release`
    )
    await installHelmDiffPlugin()
    await helmCommand(
      `helm diff upgrade --install -C 5 ${valuesOverride} ${versionArg} ${releaseName} ${chartDir} --namespace ${namespace} ${parameters.join(
        ' '
      )}`,
      true
    )
  } else {
    console.info(`Upgrading helm release ${releaseName}`)
    await helmCommand(
      `helm upgrade --install ${valuesOverride} ${versionArg} ${releaseName} ${chartDir} --timeout 120h --namespace ${namespace} ${parameters.join(
        ' '
      )}`
    )
    console.info(`Upgraded helm release ${releaseName} successful`)
  }
}

export async function getConfigMapHashes(
  celoEnv: string,
  releaseName: string,
  chartDir: string,
  parameters: string[],
  action: HelmAction,
  valuesOverrideFile?: string
): Promise<Record<string, string>> {
  const valuesOverride = valuesOverrideArg(chartDir, valuesOverrideFile)
  const [output] = await execCmd(
    `helm ${action} -f ${chartDir}/values.yaml ${valuesOverride} ${releaseName} ${chartDir} --namespace ${celoEnv} ${parameters.join(
      ' '
    )} --dry-run`,
    {},
    false,
    false
  )

  return output
    .split('---')
    .filter((section) => {
      return /kind: ConfigMap/.exec(section)
    })
    .reduce<Record<string, string>>((configHashes, section) => {
      const matchSource = /Source: (.*)/.exec(section)
      if (matchSource === null) {
        throw new Error('Can not extract Source from config section')
      }

      configHashes[matchSource[1]] = stringHash(section).toString()
      return configHashes
    }, {})
}

export function isCelotoolVerbose() {
  return process.env.CELOTOOL_VERBOSE === 'true'
}

export function isCelotoolHelmDryRun() {
  return process.env.CELOTOOL_HELM_DRY_RUN === 'true'
}

export function exitIfCelotoolHelmDryRun() {
  if (isCelotoolHelmDryRun()) {
    console.error('Option --helmdryrun is not allowed for this command. Exiting.')
    process.exit(1)
  }
}

export async function removeGenericHelmChart(releaseName: string, namespace: string) {
  console.info(`Deleting helm chart ${releaseName} from namespace ${namespace}`)
  try {
    await execCmd(`helm uninstall --namespace ${namespace} ${releaseName}`)
  } catch (error) {
    console.error(error)
  }
}

function getExtraValuesFile(celoEnv: string) {
  const extraValuesFile = fs.existsSync(`${TESTNET_CHART_DIR}/values-${celoEnv}.yaml`)
    ? `values-${celoEnv}.yaml`
    : undefined
  return extraValuesFile
}

export async function installHelmChart(celoEnv: string, useExistingGenesis: boolean) {
  await failIfSecretMissing(BACKUP_GCS_SECRET_NAME, 'default')
  await copySecret(BACKUP_GCS_SECRET_NAME, 'default', celoEnv)
  const extraValuesFile = getExtraValuesFile(celoEnv)
  return installGenericHelmChart({
    namespace: celoEnv,
    releaseName: celoEnv,
    chartDir: TESTNET_CHART_DIR,
    parameters: await helmParameters(celoEnv, useExistingGenesis),
    buildDependencies: true,
    valuesOverrideFile: extraValuesFile,
  })
}

export async function upgradeHelmChart(celoEnv: string, useExistingGenesis: boolean) {
  console.info(`Upgrading helm release ${celoEnv}`)
  const parameters = await helmParameters(celoEnv, useExistingGenesis)
  const extraValuesFile = getExtraValuesFile(celoEnv)
  await upgradeGenericHelmChart({
    namespace: celoEnv,
    releaseName: celoEnv,
    chartDir: TESTNET_CHART_DIR,
    parameters,
    buildDependencies: true,
    valuesOverrideFile: extraValuesFile,
  })
}

export async function resetAndUpgradeHelmChart(celoEnv: string, useExistingGenesis: boolean) {
  const txNodesSetName = `${celoEnv}-tx-nodes`
  const validatorsSetName = `${celoEnv}-validators`
  const bootnodeName = `${celoEnv}-bootnode`
  const privateTxNodesSetname = `${celoEnv}-tx-nodes-private`
  const persistentVolumeClaimsLabels = ['validators', 'tx_nodes', 'proxy', 'tx_nodes_private']

  if (isCelotoolHelmDryRun()) {
    // If running dryrun we just want to simulate the helm changes
    await upgradeHelmChart(celoEnv, useExistingGenesis)
  } else {
    // scale down nodes
    await scaleResource(celoEnv, 'StatefulSet', txNodesSetName, 0)
    await scaleResource(celoEnv, 'StatefulSet', validatorsSetName, 0)
    // allow to fail for the cases where a testnet does not include the privatetxnode statefulset yet
    await scaleResource(celoEnv, 'StatefulSet', privateTxNodesSetname, 0, true)
    await scaleProxies(celoEnv, 0)
    await scaleResource(celoEnv, 'Deployment', bootnodeName, 0)

    await deletePersistentVolumeClaims(celoEnv, persistentVolumeClaimsLabels)
    await sleep(10000)

    await upgradeHelmChart(celoEnv, useExistingGenesis)
    await sleep(10000)

    const numValdiators = parseInt(fetchEnv(envVar.VALIDATORS), 10)
    const numTxNodes = parseInt(fetchEnv(envVar.TX_NODES), 10)
    const numPrivateTxNodes = parseInt(fetchEnv(envVar.PRIVATE_TX_NODES), 10)

    // Note(trevor): helm upgrade only compares the current chart to the
    // previously deployed chart when deciding what needs changing, so we need
    // to manually scale up to account for when a node count is the same
    await scaleResource(celoEnv, 'StatefulSet', txNodesSetName, numTxNodes)
    await scaleResource(celoEnv, 'StatefulSet', validatorsSetName, numValdiators)
    await scaleResource(celoEnv, 'StatefulSet', privateTxNodesSetname, numPrivateTxNodes)
    await scaleProxies(celoEnv)
    await scaleResource(celoEnv, 'Deployment', bootnodeName, 1)
  }
}

// scaleProxies scales all proxy statefulsets to have `replicas` replicas.
// If `replicas` is undefined, proxies will be scaled to their intended
// replica counts
async function scaleProxies(celoEnv: string, replicas?: number) {
  if (replicas !== undefined) {
    const statefulsetNames = await getProxyStatefulsets(celoEnv)
    for (const name of statefulsetNames) {
      await scaleResource(celoEnv, 'StatefulSet', name, replicas)
    }
  } else {
    const proxiesPerValidator = getProxiesPerValidator()
    let validatorIndex = 0
    for (const proxyCount of proxiesPerValidator) {
      // allow to fail for the cases where a testnet does not include the proxy statefulset yet
      await scaleResource(
        celoEnv,
        'StatefulSet',
        `${celoEnv}-validators-${validatorIndex}-proxy`,
        proxyCount,
        true
      )
      validatorIndex++
    }
  }
}

async function getProxyStatefulsets(celoEnv: string) {
  const [output] = await execCmd(
    `kubectl get statefulsets --selector=component=proxy --no-headers -o custom-columns=":metadata.name" -n ${celoEnv}`
  )
  if (!output) {
    return []
  }
  return output.split('\n').filter((name) => name)
}

export async function removeHelmRelease(celoEnv: string) {
  return removeGenericHelmChart(celoEnv, celoEnv)
}

export function makeHelmParameters(map: { [key: string]: string }) {
  return entries(map).map(([key, value]) => `--set ${key}=${value}`)
}

export function setHelmArray(paramName: string, arr: any[]) {
  return arr.map((value, i) => `--set ${paramName}[${i}]="${value}"`)
}

export async function deleteFromCluster(celoEnv: string) {
  await removeHelmRelease(celoEnv)
  console.info(`Deleting namespace ${celoEnv}`)
  await execCmdWithExitOnFailure(`kubectl delete namespace ${celoEnv}`)
}

function useStaticIPsForGethNodes() {
  return fetchEnv(envVar.STATIC_IPS_FOR_GETH_NODES) === 'true'
}

export async function checkHelmVersion() {
  const requiredMinHelmVersion = '3.8'
  const helmVersionCmd = `helm version --template '{{ .Version }}'`
  const localHelmVersion = (await execCmdWithExitOnFailure(helmVersionCmd))[0].replace('^v', '')

  const helmOK = compareVersions.compare(localHelmVersion, requiredMinHelmVersion, '>=')
  if (helmOK) {
    return true
  } else {
    console.error(
      `Error checking local helm version. Minimum Helm version required ${requiredMinHelmVersion}`
    )
    process.exit(1)
  }
}

function rollingUpdateHelmVariables() {
  return [
    `--set updateStrategy.validators.rollingUpdate.partition=${fetchEnvOrFallback(
      envVar.VALIDATORS_ROLLING_UPDATE_PARTITION,
      '0'
    )}`,
    `--set updateStrategy.secondaries.rollingUpdate.partition=${fetchEnvOrFallback(
      envVar.SECONDARIES_ROLLING_UPDATE_PARTITION,
      '0'
    )}`,
    `--set updateStrategy.proxy.rollingUpdate.partition=${fetchEnvOrFallback(
      envVar.PROXY_ROLLING_UPDATE_PARTITION,
      '0'
    )}`,
    `--set updateStrategy.tx_nodes.rollingUpdate.partition=${fetchEnvOrFallback(
      envVar.TX_NODES_ROLLING_UPDATE_PARTITION,
      '0'
    )}`,
    `--set updateStrategy.tx_nodes_private.rollingUpdate.partition=${fetchEnvOrFallback(
      envVar.TX_NODES_PRIVATE_ROLLING_UPDATE_PARTITION,
      '0'
    )}`,
  ]
}

export async function saveHelmValuesFile(
  celoEnv: string,
  valueFilePath: string,
  useExistingGenesis: boolean,
  skipGenesisValue = false
) {
  const genesisContent = useExistingGenesis
    ? await getGenesisBlockFromGoogleStorage(celoEnv)
    : generateGenesisFromEnv()

  const enodes = await getEnodesWithExternalIPAddresses(celoEnv)

  let valueFileContent = `
staticnodes:
  staticnodesBase64: ${Buffer.from(JSON.stringify(enodes)).toString('base64')}
`
  if (!skipGenesisValue) {
    valueFileContent += `
  genesis:
    genesisFileBase64: ${Buffer.from(genesisContent).toString('base64')}
`
  }
  fs.writeFileSync(valueFilePath, valueFileContent)
}

const celoBlockchainDir: string = path.join(os.tmpdir(), 'celo-blockchain-celotool')

export async function createAndPushGenesis(celoEnv: string, reset: boolean, useMyCelo: boolean) {
  let genesis: string = ''
  try {
    genesis = await getGenesisBlockFromGoogleStorage(celoEnv)
  } catch {
    console.debug(`Genesis file not found in GCP. Creating a new one`)
  }
  if (genesis === '' || reset === true) {
    genesis = useMyCelo ? await generateMyCeloGenesis() : generateGenesisFromEnv()
  }
  // Upload the new genesis file to gcp
  if (!isCelotoolHelmDryRun()) {
    await uploadGenesisBlockToGoogleStorage(celoEnv, genesis)
  }
}

async function generateMyCeloGenesis(): Promise<string> {
  // Clean up the tmp dir
  await spawnCmd('rm', ['-rf', celoBlockchainDir], { silent: true })
  fs.mkdirSync(celoBlockchainDir)
  const gethTag =
    fetchEnvOrFallback(envVar.GETH_MYCELO_COMMIT, '') !== ''
      ? fetchEnv(envVar.GETH_MYCELO_COMMIT)
      : fetchEnv(envVar.GETH_NODE_DOCKER_IMAGE_TAG)
  const celoBlockchainVersion = gethTag.includes('.') ? `v${gethTag}` : gethTag
  await checkoutGethRepo(celoBlockchainVersion, celoBlockchainDir)
  await buildGethAll(celoBlockchainDir)

  // Generate genesis-config from template
  const myceloBinary = path.join(celoBlockchainDir, 'build/bin/mycelo')
  const myceloGenesisConfigArgs = [
    'genesis-config',
    '--template',
    'monorepo',
    '--mnemonic',
    fetchEnv(envVar.MNEMONIC),
    '--validators',
    fetchEnv(envVar.VALIDATORS),
    '--dev.accounts',
    fetchEnv(envVar.LOAD_TEST_CLIENTS),
    '--blockperiod',
    fetchEnv(envVar.BLOCK_TIME),
    '--epoch',
    fetchEnv(envVar.EPOCH),
    '--blockgaslimit',
    '20000000',
  ]
  await spawnCmdWithExitOnFailure(myceloBinary, myceloGenesisConfigArgs, {
    silent: false,
    cwd: celoBlockchainDir,
  })

  // TODO: Load config to customize migrations...

  // Generate genesis from config

  const myceloGenesisFromConfigArgs = [
    'genesis-from-config',
    celoBlockchainDir,
    '--buildpath',
    path.join(monorepoRoot, 'packages/protocol/build/contracts'),
  ]
  await spawnCmdWithExitOnFailure(myceloBinary, myceloGenesisFromConfigArgs, {
    silent: false,
    cwd: celoBlockchainDir,
  })
  const genesisPath = path.join(celoBlockchainDir, 'genesis.json')
  const genesisContent = fs.readFileSync(genesisPath).toString()

  // Clean up the tmp dir as it's no longer needed
  await spawnCmd('rm', ['-rf', celoBlockchainDir], { silent: true })
  return genesisContent
}

function useDefaultNetwork() {
  return fetchEnv(envVar.KUBERNETES_CLUSTER_NAME) === 'celo-networks-dev'
}

export function networkName(celoEnv: string) {
  return useDefaultNetwork() ? 'default' : `${celoEnv}-network`
}
