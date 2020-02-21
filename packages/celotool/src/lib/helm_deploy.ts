import { entries, range } from 'lodash'
import sleep from 'sleep-promise'
import { getKubernetesClusterRegion, switchToClusterFromEnv } from './cluster'
import { EnvTypes, envVar, fetchEnv, fetchEnvOrFallback, isProduction } from './env-utils'
import { ensureAuthenticatedGcloudAccount } from './gcloud_utils'
import { generateGenesisFromEnv } from './generate_utils'
import { getStatefulSetReplicas, scaleResource } from './kubernetes'
import { execCmd, execCmdWithExitOnFailure, outputIncludes, switchToProjectFromEnv } from './utils'

const CLOUDSQL_SECRET_NAME = 'blockscout-cloudsql-credentials'
const BACKUP_GCS_SECRET_NAME = 'backup-blockchain-credentials'
const TIMEOUT_FOR_LOAD_BALANCER_POLL = 1000 * 60 * 25 // 25 minutes
const LOAD_BALANCER_POLL_INTERVAL = 1000 * 10 // 10 seconds

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
  kubectl apply --namespace=${destNamespace} -f -`)
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
  } catch (error) {
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
  } catch (error) {
    console.error(error.message.trim())
  }

  const envType = fetchEnv(envVar.ENV_TYPE)
  if (envType !== EnvTypes.DEVELOPMENT) {
    try {
      await execCmdWithExitOnFailure(
        `gcloud sql instances create ${instanceName}-replica --master-instance-name=${instanceName} --zone ${fetchEnv(
          envVar.KUBERNETES_CLUSTER_ZONE
        )}`
      )
    } catch (error) {
      console.error(error.message.trim())
    }
  }

  await execCmdWithExitOnFailure(
    `gcloud sql instances patch ${instanceName} --backup-start-time 17:00`
  )

  const blockscoutDBUsername = Math.random()
    .toString(36)
    .slice(-8)
  const blockscoutDBPassword = Math.random()
    .toString(36)
    .slice(-8)

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

async function createAndUploadKubernetesSecretIfNotExists(
  secretName: string,
  serviceAccountName: string
) {
  await switchToClusterFromEnv()
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

export async function createAndUploadCloudSQLSecretIfNotExists(serviceAccountName: string) {
  return createAndUploadKubernetesSecretIfNotExists(CLOUDSQL_SECRET_NAME, serviceAccountName)
}

export async function createAndUploadBackupSecretIfNotExists(serviceAccountName: string) {
  return createAndUploadKubernetesSecretIfNotExists(BACKUP_GCS_SECRET_NAME, serviceAccountName)
}

export async function createServiceAccountIfNotExists(name: string) {
  await switchToProjectFromEnv()
  // TODO: add permissions for cloudsql editor to service account
  const serviceAccountExists = await outputIncludes(
    `gcloud iam service-accounts list`,
    name,
    `Service account ${name} exists, skipping creation`
  )
  if (!serviceAccountExists) {
    await execCmdWithExitOnFailure(
      `gcloud iam service-accounts create ${name} --display-name="${name}"`
    )
  }
}

export function getServiceAccountName(prefix: string) {
  // NOTE: trim to meet the max size requirements of service account names
  return `${prefix}-${fetchEnv(envVar.KUBERNETES_CLUSTER_NAME)}`.slice(0, 30)
}

export async function uploadStorageClass() {
  // TODO: allow this to run from anywhere
  await execCmdWithExitOnFailure(`kubectl apply -f ../helm-charts/testnet/ssdstorageclass.yaml`)
}

export async function redeployTiller() {
  const tillerServiceAccountExists = await outputIncludes(
    `kubectl get serviceaccounts --namespace=kube-system`,
    `tiller`,
    `Tiller service account exists, skipping creation`
  )
  if (!tillerServiceAccountExists) {
    await execCmdWithExitOnFailure(
      `kubectl create serviceaccount tiller --namespace=kube-system && kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller && helm init --service-account=tiller`
    )
    await sleep(20000)
  }
}

export async function installCertManagerAndNginx() {
  // Cert Manager is the newer version of lego
  const certManagerExists = await outputIncludes(
    `helm list`,
    `cert-manager-cluster-issuers`,
    `cert-manager-cluster-issuers exists, skipping install`
  )
  if (!certManagerExists) {
    await installCertManager()
  }
  const nginxIngressReleaseExists = await outputIncludes(
    `helm list`,
    `nginx-ingress-release`,
    `nginx-ingress-release exists, skipping install`
  )
  if (!nginxIngressReleaseExists) {
    await execCmdWithExitOnFailure(`helm install --name nginx-ingress-release stable/nginx-ingress`)
  }
}

export async function installCertManager() {
  const clusterIssuersHelmChartPath = `../helm-charts/cert-manager-cluster-issuers`

  console.info('Installing cert-manager CustomResourceDefinitions')
  await execCmdWithExitOnFailure(
    `kubectl apply --validate=false -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.11/deploy/manifests/00-crds.yaml`
  )
  console.info('Updating cert-manager-cluster-issuers dependencies')
  await execCmdWithExitOnFailure(`helm dependency update ${clusterIssuersHelmChartPath}`)
  console.info('Installing cert-manager-cluster-issuers')
  await execCmdWithExitOnFailure(
    `helm install --name cert-manager-cluster-issuers ${clusterIssuersHelmChartPath}`
  )
}

export async function installAndEnableMetricsDeps() {
  const kubeStateMetricsReleaseExists = await outputIncludes(
    `helm list`,
    `kube-state-metrics`,
    `kube-state-metrics exists, skipping install`
  )
  if (!kubeStateMetricsReleaseExists) {
    await execCmdWithExitOnFailure(
      `helm install --name kube-state-metrics stable/kube-state-metrics --set rbac.create=true`
    )
  }
  const kubeStateMetricsPrometheusReleaseExists = await outputIncludes(
    `helm list`,
    `kube-state-metrics-prometheus-to-sd`,
    `kube-state-metrics-prometheus-to-sd exists, skipping install`
  )
  if (!kubeStateMetricsPrometheusReleaseExists) {
    const promToSdParams = [
      `--set "metricsSources.kube-state-metrics=http://kube-state-metrics.default.svc.cluster.local:8080"`,
      `--set promtosd.scrape_interval=${fetchEnv('PROMTOSD_SCRAPE_INTERVAL')}`,
      `--set promtosd.export_interval=${fetchEnv('PROMTOSD_EXPORT_INTERVAL')}`,
    ]
    await execCmdWithExitOnFailure(
      `helm install --name kube-state-metrics-prometheus-to-sd ../helm-charts/prometheus-to-sd ${promToSdParams.join(
        ' '
      )}`
    )
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

export async function retrieveCloudSQLConnectionInfo(celoEnv: string, instanceName: string) {
  await validateExistingCloudSQLInstance(instanceName)
  const [blockscoutDBUsername] = await execCmdWithExitOnFailure(
    `kubectl get secret ${celoEnv}-blockscout -o jsonpath='{.data.DATABASE_USER}' -n ${celoEnv} | base64 --decode`
  )
  const [blockscoutDBPassword] = await execCmdWithExitOnFailure(
    `kubectl get secret ${celoEnv}-blockscout -o jsonpath='{.data.DATABASE_PASSWORD}' -n ${celoEnv} | base64 --decode`
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

async function registerIPAddress(name: string) {
  console.info(`Registering IP address ${name}`)
  try {
    await execCmd(
      `gcloud compute addresses create ${name} --region ${getKubernetesClusterRegion()}`
    )
  } catch (error) {
    if (!error.toString().includes('already exists')) {
      console.error(error)
      process.exit(1)
    }
  }
}

async function deleteIPAddress(name: string) {
  console.info(`Deleting IP address ${name}`)
  try {
    await execCmd(
      `gcloud compute addresses delete ${name} --region ${getKubernetesClusterRegion()} -q`
    )
  } catch (error) {
    if (!error.toString().includes('was not found')) {
      console.error(error)
      process.exit(1)
    }
  }
}

export async function retrieveIPAddress(name: string) {
  const [address] = await execCmdWithExitOnFailure(
    `gcloud compute addresses describe ${name}  --region ${getKubernetesClusterRegion()} --format="value(address)"`
  )
  return address.replace(/\n*$/, '')
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
  await Promise.all(range(numTxNodes).map((i) => registerIPAddress(`${celoEnv}-tx-nodes-${i}`)))

  if (useStaticIPsForGethNodes()) {
    await registerIPAddress(`${celoEnv}-bootnode`)

    const numValdiators = parseInt(fetchEnv(envVar.VALIDATORS), 10)
    await Promise.all(
      range(numValdiators).map((i) => registerIPAddress(`${celoEnv}-validators-${i}`))
    )
  }

  return
}

export async function upgradeStaticIPs(celoEnv: string) {
  const prevTxNodeCount = await getStatefulSetReplicas(celoEnv, `${celoEnv}-tx-nodes`)
  const newTxNodeCount = parseInt(fetchEnv(envVar.TX_NODES), 10)
  await upgradeNodeTypeStaticIPs(celoEnv, 'tx-nodes', prevTxNodeCount, newTxNodeCount)

  if (useStaticIPsForGethNodes()) {
    const prevValidatorNodeCount = await getStatefulSetReplicas(celoEnv, `${celoEnv}-validators`)
    const newValidatorNodeCount = parseInt(fetchEnv(envVar.VALIDATORS), 10)
    await upgradeNodeTypeStaticIPs(
      celoEnv,
      'validators',
      prevValidatorNodeCount,
      newValidatorNodeCount
    )
  }
}

async function upgradeNodeTypeStaticIPs(
  celoEnv: string,
  nodeType: string,
  previousNodeCount: number,
  newNodeCount: number
) {
  if (previousNodeCount < newNodeCount) {
    console.info(`Scaling up ${nodeType} node count from ${previousNodeCount} to ${newNodeCount}`)
    await Promise.all(
      range(previousNodeCount, newNodeCount).map((i) =>
        registerIPAddress(`${celoEnv}-${nodeType}-${i}`)
      )
    )
  } else if (previousNodeCount > newNodeCount) {
    console.info(`Scaling down ${nodeType} node count from ${previousNodeCount} to ${newNodeCount}`)
    await Promise.all(
      range(newNodeCount, previousNodeCount).map((i) =>
        deleteIPAddress(`${celoEnv}-${nodeType}-${i}`)
      )
    )
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
  return
}

export async function deleteStaticIPs(celoEnv: string) {
  console.info(`Deleting static IPs for ${celoEnv}`)

  const numTxNodes = parseInt(fetchEnv(envVar.TX_NODES), 10)
  await Promise.all(range(numTxNodes).map((i) => deleteIPAddress(`${celoEnv}-tx-nodes-${i}`)))

  await deleteIPAddress(`${celoEnv}-bootnode`)

  const numValdiators = parseInt(fetchEnv(envVar.VALIDATORS), 10)
  await Promise.all(range(numValdiators).map((i) => deleteIPAddress(`${celoEnv}-validators-${i}`)))
  return
}

export async function deletePersistentVolumeClaims(celoEnv: string) {
  console.info(`Deleting persistent volume claims for ${celoEnv}`)
  try {
    const componentLabels = ['validators', 'tx_nodes', 'proxy']
    for (const component of componentLabels) {
      const [output] = await execCmd(
        `kubectl delete pvc --selector='component=${component}' --namespace ${celoEnv}`
      )
      console.info(output)
    }
  } catch (error) {
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

  const txAddresses = await Promise.all(
    range(numTxNodes).map((i) => retrieveIPAddress(`${celoEnv}-tx-nodes-${i}`))
  )

  const singleAddressParameters = txAddresses.map(
    (address, i) => `--set geth.tx_nodes_${i}IpAddress=${address}`
  )

  ipAddressParameters.push(...singleAddressParameters)

  const listOfAddresses = txAddresses.join('/')
  ipAddressParameters.push(`--set geth.tx_node_ip_addresses=${listOfAddresses}`)

  if (useStaticIPsForGethNodes()) {
    ipAddressParameters.push(
      `--set geth.bootnodeIpAddress=${await retrieveIPAddress(`${celoEnv}-bootnode`)}`
    )

    const numValidators = parseInt(fetchEnv(envVar.VALIDATORS), 10)

    const validatorsAddresses = await Promise.all(
      range(numValidators).map((i) => retrieveIPAddress(`${celoEnv}-validators-${i}`))
    )

    const singleValidatorAddressParameters = validatorsAddresses.map(
      (address, i) => `--set geth.validators_${i}IpAddress=${address}`
    )

    ipAddressParameters.push(...singleValidatorAddressParameters)
    const listOfValidatorAddresses = validatorsAddresses.join('/')
    ipAddressParameters.push(`--set geth.validator_ip_addresses=${listOfValidatorAddresses}`)
  }

  return ipAddressParameters
}

async function helmParameters(celoEnv: string) {
  const bucketName = isProduction() ? 'contract_artifacts_production' : 'contract_artifacts'
  const productionTagOverrides = isProduction()
    ? [
        `--set gethexporter.image.repository=${fetchEnv('GETH_EXPORTER_DOCKER_IMAGE_REPOSITORY')}`,
        `--set gethexporter.image.tag=${fetchEnv('GETH_EXPORTER_DOCKER_IMAGE_TAG')}`,
      ]
    : []

  return [
    `--set domain.name=${fetchEnv('CLUSTER_DOMAIN_NAME')}`,
    `--set geth.verbosity=${fetchEnvOrFallback('GETH_VERBOSITY', '4')}`,
    `--set geth.node.cpu_request=${fetchEnv('GETH_NODE_CPU_REQUEST')}`,
    `--set geth.node.memory_request=${fetchEnv('GETH_NODE_MEMORY_REQUEST')}`,
    `--set geth.genesisFile=${Buffer.from(generateGenesisFromEnv()).toString('base64')}`,
    `--set geth.genesis.networkId=${fetchEnv(envVar.NETWORK_ID)}`,
    `--set geth.image.repository=${fetchEnv('GETH_NODE_DOCKER_IMAGE_REPOSITORY')}`,
    `--set geth.image.tag=${fetchEnv('GETH_NODE_DOCKER_IMAGE_TAG')}`,
    `--set geth.backup.enabled=${fetchEnv(envVar.GETH_NODES_BACKUP_CRONJOB_ENABLED)}`,
    `--set bootnode.image.repository=${fetchEnv('GETH_BOOTNODE_DOCKER_IMAGE_REPOSITORY')}`,
    `--set bootnode.image.tag=${fetchEnv('GETH_BOOTNODE_DOCKER_IMAGE_TAG')}`,
    `--set cluster.zone=${fetchEnv('KUBERNETES_CLUSTER_ZONE')}`,
    `--set cluster.name=${fetchEnv('KUBERNETES_CLUSTER_NAME')}`,
    `--set bucket=${bucketName}`,
    `--set project.name=${fetchEnv('TESTNET_PROJECT_NAME')}`,
    `--set celotool.image.repository=${fetchEnv('CELOTOOL_DOCKER_IMAGE_REPOSITORY')}`,
    `--set celotool.image.tag=${fetchEnv('CELOTOOL_DOCKER_IMAGE_TAG')}`,
    `--set promtosd.scrape_interval=${fetchEnv('PROMTOSD_SCRAPE_INTERVAL')}`,
    `--set promtosd.export_interval=${fetchEnv('PROMTOSD_EXPORT_INTERVAL')}`,
    `--set geth.consensus_type=${fetchEnv('CONSENSUS_TYPE')}`,
    `--set geth.blocktime=${fetchEnv('BLOCK_TIME')}`,
    `--set geth.validators="${fetchEnv('VALIDATORS')}"`,
    `--set geth.istanbulrequesttimeout=${fetchEnvOrFallback(
      'ISTANBUL_REQUEST_TIMEOUT_MS',
      '3000'
    )}`,
    `--set geth.faultyValidators="${fetchEnvOrFallback('FAULTY_VALIDATORS', '0')}"`,
    `--set geth.faultyValidatorType="${fetchEnvOrFallback('FAULTY_VALIDATOR_TYPE', '0')}"`,
    `--set geth.tx_nodes="${fetchEnv('TX_NODES')}"`,
    `--set geth.ssd_disks="${fetchEnvOrFallback(envVar.GETH_NODES_SSD_DISKS, 'true')}"`,
    `--set mnemonic="${fetchEnv('MNEMONIC')}"`,
    `--set contracts.cron_jobs.enabled=${fetchEnv('CONTRACT_CRONJOBS_ENABLED')}`,
    `--set geth.account.secret="${fetchEnv('GETH_ACCOUNT_SECRET')}"`,
    `--set geth.debug=${fetchEnvOrFallback('GETH_DEBUG', 'false')}`,
    `--set geth.ping_ip_from_packet=${fetchEnvOrFallback('PING_IP_FROM_PACKET', 'false')}`,
    `--set geth.in_memory_discovery_table=${fetchEnvOrFallback(
      'IN_MEMORY_DISCOVERY_TABLE',
      'false'
    )}`,
    `--set geth.proxiedValidators=${fetchEnvOrFallback(envVar.PROXIED_VALIDATORS, '0')}`,
    ...productionTagOverrides,
    ...(await helmIPParameters(celoEnv)),
  ]
}

async function helmCommand(command: string) {
  if (isCelotoolVerbose() && !command.includes(' dep build ')) {
    await execCmdWithExitOnFailure(command + ' --dry-run --debug')
  } else if (isCelotoolVerbose()) {
    await execCmdWithExitOnFailure(command + ' --debug')
  }

  await execCmdWithExitOnFailure(command)
}

function buildHelmChartDependencies(chartDir: string) {
  console.info(`Building any chart dependencies...`)
  return helmCommand(`helm dep build ${chartDir}`)
}

export async function installGenericHelmChart(
  celoEnv: string,
  releaseName: string,
  chartDir: string,
  parameters: string[]
) {
  await buildHelmChartDependencies(chartDir)

  console.info(`Installing helm release ${releaseName}`)
  await helmCommand(
    `helm install ${chartDir} --name ${releaseName} --namespace ${celoEnv} ${parameters.join(' ')}`
  )
}

export async function upgradeGenericHelmChart(
  celoEnv: string,
  releaseName: string,
  chartDir: string,
  parameters: string[]
) {
  await buildHelmChartDependencies(chartDir)

  console.info(`Upgrading helm release ${releaseName}`)
  await helmCommand(
    `helm upgrade ${releaseName} ${chartDir} --namespace ${celoEnv} ${parameters.join(' ')}`
  )
  console.info(`Upgraded helm release ${releaseName}`)
}

export function isCelotoolVerbose() {
  return process.env.CELOTOOL_VERBOSE === 'true'
}

export async function removeGenericHelmChart(releaseName: string) {
  console.info(`Deleting helm chart ${releaseName}`)
  try {
    await execCmd(`helm del --purge ${releaseName}`)
  } catch (error) {
    console.error(error)
  }
}

export async function installHelmChart(celoEnv: string) {
  await failIfSecretMissing(BACKUP_GCS_SECRET_NAME, 'default')
  await copySecret(BACKUP_GCS_SECRET_NAME, 'default', celoEnv)
  return installGenericHelmChart(
    celoEnv,
    celoEnv,
    '../helm-charts/testnet',
    await helmParameters(celoEnv)
  )
}

export async function upgradeHelmChart(celoEnv: string) {
  console.info(`Upgrading helm release ${celoEnv}`)
  const parameters = await helmParameters(celoEnv)
  await upgradeGenericHelmChart(celoEnv, celoEnv, '../helm-charts/testnet', parameters)
  console.info(`Helm release ${celoEnv} upgrade successful`)
}

export async function resetAndUpgradeHelmChart(celoEnv: string) {
  const txNodesSetName = `${celoEnv}-tx-nodes`
  const validatorsSetName = `${celoEnv}-validators`
  const bootnodeName = `${celoEnv}-bootnode`
  const proxyName = `${celoEnv}-proxy`

  // scale down nodes
  await scaleResource(celoEnv, 'StatefulSet', txNodesSetName, 0)
  await scaleResource(celoEnv, 'StatefulSet', validatorsSetName, 0)
  // allow to fail for the cases where a testnet does not include the proxy statefulset yet
  await scaleResource(celoEnv, 'StatefulSet', proxyName, 0, true)
  await scaleResource(celoEnv, 'Deployment', bootnodeName, 0)

  await deletePersistentVolumeClaims(celoEnv)
  await sleep(10000)

  await upgradeHelmChart(celoEnv)
  await sleep(10000)

  const numValdiators = parseInt(fetchEnv(envVar.VALIDATORS), 10)
  const numTxNodes = parseInt(fetchEnv(envVar.TX_NODES), 10)
  // assumes 1 proxy per proxied validator
  const numProxies = parseInt(fetchEnvOrFallback(envVar.PROXIED_VALIDATORS, '0'), 10)

  // Note(trevor): helm upgrade only compares the current chart to the
  // previously deployed chart when deciding what needs changing, so we need
  // to manually scale up to account for when a node count is the same
  await scaleResource(celoEnv, 'StatefulSet', txNodesSetName, numTxNodes)
  await scaleResource(celoEnv, 'StatefulSet', validatorsSetName, numValdiators)
  await scaleResource(celoEnv, 'StatefulSet', proxyName, numProxies)
  await scaleResource(celoEnv, 'Deployment', bootnodeName, 1)
}

export async function removeHelmRelease(celoEnv: string) {
  return removeGenericHelmChart(celoEnv)
}

export function makeHelmParameters(map: { [key: string]: string }) {
  return entries(map).map(([key, value]) => `--set ${key}=${value}`)
}

export async function deleteFromCluster(celoEnv: string) {
  await removeHelmRelease(celoEnv)
  console.info(`Deleting namespace ${celoEnv}`)
  await execCmdWithExitOnFailure(`kubectl delete namespace ${celoEnv}`)
}

function useStaticIPsForGethNodes() {
  return fetchEnv(envVar.STATIC_IPS_FOR_GETH_NODES) === 'true'
}
