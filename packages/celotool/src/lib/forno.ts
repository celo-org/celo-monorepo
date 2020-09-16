import { execCmd } from './cmd-utils'
import { coerceContext, getClusterManagerForContext, readableContext } from './context-utils'
import { envVar, fetchEnv } from './env-utils'
import { GCPClusterConfig } from './k8s-cluster/gcp'
import { TerraformVars } from './terraform'
import { deployModule } from './vm-testnet-utils'

const FORNO_TERRAFORM_MODULE_NAME = 'forno'

export async function deployFornoLBs(celoEnv: string) {
  const contexts: string[] = fetchEnv(envVar.FORNO_FULL_NODE_CONTEXTS).split(',').map(coerceContext)
  console.log('contexts', contexts)
  const terraformVars: TerraformVars = await getFornoTerraformVars(celoEnv, contexts)
  console.log('terraformVars', terraformVars)
  await deployModule(
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
      const clusterManager = getClusterManagerForContext(celoEnv, context)
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

  const httpContextInfos = await getContextInfos(8545)
  const wsContextInfos = await getContextInfos(8546)

  return {
    backend_max_requests_per_second: '300',
    celo_env: celoEnv,
    http_context_info: JSON.stringify(httpContextInfos),
    ws_context_info: JSON.stringify(wsContextInfos),
    domains: JSON.stringify(domains),
    gcloud_credentials_path: fetchEnv(envVar.GOOGLE_APPLICATION_CREDENTIALS),
    gcloud_project: gcloudProject!,
    vpc_network_name: fetchEnv(envVar.FORNO_VPC_NETWORK_NAME),
  }
}
