import { execCmd } from './cmd-utils'
import { coerceContext, getClusterManagerForContext, readableContext, serviceName } from './context-utils'
import { envVar, fetchEnv } from './env-utils'
import { CloudProvider } from './k8s-cluster/base'
import { GCPClusterConfig } from './k8s-cluster/gcp'
import { TerraformVars } from './terraform'
import { deployModule, destroyModule } from './vm-testnet-utils'

const FORNO_TERRAFORM_MODULE_NAME = 'forno'

export async function deployForno(celoEnv: string) {
  const contexts: string[] = fetchEnv(envVar.FORNO_FULL_NODE_CONTEXTS).split(',').map(coerceContext)
  console.info('Deploying Forno with full node contexts:', contexts)
  const terraformVars: TerraformVars = await getFornoTerraformVars(celoEnv, contexts)
  // This prints the global IP address for forno
  await deployModule(
    celoEnv,
    FORNO_TERRAFORM_MODULE_NAME,
    terraformVars
  )
  console.info('Note: in order to have an SSL certificate be properly provisioned, DNS entries for the relevant domains must point to the printed IP above.')
}

export async function destroyForno(celoEnv: string) {
  const contexts: string[] = fetchEnv(envVar.FORNO_FULL_NODE_CONTEXTS).split(',').map(coerceContext)
  console.info('DESTROYING Forno')
  const terraformVars: TerraformVars = await getFornoTerraformVars(celoEnv, contexts)
  await destroyModule(
    celoEnv,
    FORNO_TERRAFORM_MODULE_NAME,
    terraformVars
  )
}

interface ContextInfoTerraformVars {
  rpc_service_network_endpoint_group_name: string
  zone: string
}

async function getFornoTerraformVars(celoEnv: string, contexts: string[]): Promise<TerraformVars> {
  let gcloudProject: string | undefined
  const getContextInfos = async (port: number): Promise<{ [context: string]: ContextInfoTerraformVars }> =>
    contexts.reduce(async (aggPromise, context: string) => {
      const agg = await aggPromise
      const clusterManager = getClusterManagerForContext(celoEnv, context, serviceName.Forno)
      if (clusterManager.cloudProvider !== CloudProvider.GCP) {
        throw Error(`Forno only accepts GCP contexts, context ${context} is ${clusterManager.cloudProvider}`)
      }
      const contextGcloudProject = (clusterManager.clusterConfig as GCPClusterConfig).projectName
      // Require all the contexts to have the same project
      if (gcloudProject === undefined) {
        gcloudProject = contextGcloudProject
      } else if (gcloudProject !== contextGcloudProject) {
        throw Error(`All contexts must be in the same Google Cloud project`)
      }
      // Rather than using clusterManager.kubernetesContextName we switch to the
      // cluster to account for the case where this user has not gotten the
      // context for the cluster yet.
      await clusterManager.switchToClusterContext(true)
      const [output] = await execCmd(
        `kubectl get svc ${celoEnv}-fullnodes-rpc -n ${celoEnv} -o jsonpath="{.metadata.annotations.cloud\\.google\\.com/neg-status}"`
      )
      if (!output.trim()) {
        throw Error(`Expected cloud.google.com/neg-status annotation for service ${celoEnv}-fullnodes-rpc`)
      }
      const outputParsed = JSON.parse(output)
      if (!outputParsed.network_endpoint_groups[port] || !outputParsed.zones.length) {
        throw Error(`Expected NEG for ${port} and > 0 zones, instead got NEG: ${outputParsed.network_endpoint_groups[port]} and zones ${outputParsed.zones}`)
      }
      return {
        ...agg,
        [readableContext(context)]: {
          rpc_service_network_endpoint_group_name: outputParsed.network_endpoint_groups[port],
          // Only expect a single zone
          zone: outputParsed.zones[0]
        }
      }
    }, Promise.resolve({}))

  // Make sure each domain ends with a period
  const domains = fetchEnv(envVar.FORNO_DOMAINS).split(',').map((domain: string) => {
    if (!domain.endsWith('.')) {
      return `${domain}.`
    }
    return domain
  })
  const HTTP_RPC_PORT = 8545
  const WS_RPC_PORT = 8546
  const contextInfosHttp = await getContextInfos(HTTP_RPC_PORT)
  const contextInfosWs = await getContextInfos(WS_RPC_PORT)

  return {
    backend_max_requests_per_second: '300',
    celo_env: celoEnv,
    context_info_http: JSON.stringify(contextInfosHttp),
    context_info_ws: JSON.stringify(contextInfosWs),
    gcloud_credentials_path: fetchEnv(envVar.GOOGLE_APPLICATION_CREDENTIALS),
    gcloud_project: gcloudProject!,
    ssl_cert_domains: JSON.stringify(domains),
    vpc_network_name: fetchEnv(envVar.FORNO_VPC_NETWORK_NAME),
  }
}
