import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { getBlockchainApiUrl, getBlockscoutUrl, getEthstatsUrl } from 'src/lib/endpoints'
import {
  addCeloEnvMiddleware,
  CeloEnvArgv,
  envVar,
  fetchEnv,
  fetchEnvOrFallback,
  getEnvFile,
} from 'src/lib/env-utils'
import { Arguments, Argv } from 'yargs'

export const command = 'links <resource>'
export const describe = 'commands for various useful links'

interface LinkArgEnv extends CeloEnvArgv {
  open: boolean
  explanation: boolean
}

export const builder = (yargs: Argv) => {
  const config = addCeloEnvMiddleware(yargs)
    .option('open', {
      alias: 'o',
      type: 'boolean',
      description: 'Whether to open the link automatically',
      default: false,
    })
    .option('explanation', {
      type: 'boolean',
      description: 'Whether to print out explanation of the link',
      default: true,
    })
    .command('all', 'prints out all links', {}, async (rawArgs: Arguments) => {
      commands.forEach(async (cmd) => {
        const argv = (rawArgs as any) as LinkArgEnv
        const url = cmd.url(argv)

        console.info(`$ celotooljs links ${cmd.command}\n`)
        if (argv.explanation) {
          console.info(cmd.explanation)
        }

        if (argv.open) {
          await execCmdWithExitOnFailure(`open "${url}"`)
        }
        console.info(url)
        console.info('')
      })
    })

  return commands.reduce((pYargs: Argv, cmd) => {
    return pYargs.command(cmd.command, cmd.description, {}, async (rawArgs: Arguments) => {
      const argv = (rawArgs as any) as LinkArgEnv
      const url = cmd.url(argv)
      if (argv.explanation) {
        console.info(cmd.explanation)
      }

      if (argv.open) {
        await execCmdWithExitOnFailure(`open "${url}"`)
      }
      console.info(url)
    })
  }, config)
}

export const handler = () => {
  // empty
}

const commands = [
  {
    command: 'k8s-workloads',
    description: 'Kubernetes Workloads Page in Google Cloud',
    url: (argv: LinkArgEnv) =>
      `https://console.cloud.google.com/kubernetes/workload?project=${fetchEnv(
        envVar.TESTNET_PROJECT_NAME
      )}&workload_list_tablesize=50&workload_list_tablequery=%255B%257B_22k_22_3A_22is_system_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22false_5C_22_22_2C_22s_22_3Atrue%257D_2C%257B_22k_22_3A_22metadata%252Fnamespace_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22${
        argv.celoEnv
      }_5C_22_22%257D%255D`,
    explanation:
      'This links to the Google Cloud Console that lists all the Kubernetes Workloads running in the specified CELO_ENV. That currently includes things like our geth nodes, Blockscout, EthStats, CronJobs that check healthiness of the network etc. This is a good first place to check that workloads are running as we expect',
  },
  {
    command: 'stackdriver-dashboard',
    description: 'Stackdriver Dashboard',
    url: (_argv: LinkArgEnv) =>
      fetchEnvOrFallback(envVar.STACKDRIVER_MONITORING_DASHBOARD, 'No Dashboard'),
    explanation:
      'The Stackdriver Monitoring Dashboard contains graphs for all the relevant alerts that we have setup and should give you a way of determining which metrics are out of order and what possible other correlations in time one could deduce from the metrics.',
  },
  {
    command: 'geth-logs',
    description: 'logs of all geth nodes',
    url: (argv: LinkArgEnv) =>
      `https://console.cloud.google.com/logs/viewer\?interval\=NO_LIMIT\&project\=${fetchEnv(
        envVar.TESTNET_PROJECT_NAME
      )}\&minLogLevel\=0\&expandAll\=false\&customFacets\=\&limitCustomFacetWidth\=true\&advancedFilter\=resource.type%3D%22container%22%0Aresource.labels.namespace_id%3D%22${
        argv.celoEnv
      }%22%0Aresource.labels.container_name%3D%22geth%22`,
    explanation:
      'For issues with geth nodes not behaving the way you expect, you can take a look at the logs they output.',
  },
  {
    command: 'blockscout',
    description: 'blockscout, the block explorer',
    url: (argv: CeloEnvArgv) => getBlockscoutUrl(argv.celoEnv),
    explanation:
      'Blockscout can be useful to take a look at Blocks, Transactions and Token Transfers and they made it onto the blockchain.',
  },
  {
    command: 'ethstats',
    description: 'ethstats',
    url: (argv: CeloEnvArgv) => getEthstatsUrl(argv.celoEnv),
    explanation:
      'Ethstats gives us quick insight into what the geth nodes are reporting as their peer number, their latest block, etc.',
  },
  {
    command: 'blockchain-api',
    description: 'blockchain-api',
    url: (argv: CeloEnvArgv) => getBlockchainApiUrl(argv.celoEnv),
    explanation:
      'The blockchain-api exposes a GraphQL Explorer through which you can verify some queries the service itself uses',
  },
  {
    command: '.env',
    description: 'the currently applied configuration',
    url: (argv: LinkArgEnv) => getEnvFile(argv.celoEnv),
    explanation:
      'The path to the .env file that is used with the current specification of CELO_ENV',
  },
  {
    command: 'mobile-wallet-playstore',
    description: 'Mobile Wallet in the Playstore',
    url: (_argv: LinkArgEnv) =>
      fetchEnvOrFallback(envVar.MOBILE_WALLET_PLAYSTORE_LINK, 'No Mobile Wallet link'),
    explanation:
      "Gives you the link to the playstore page for this environment's mobile wallet app",
  },
]
