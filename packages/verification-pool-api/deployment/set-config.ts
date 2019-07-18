// Script used for setting firebase environemnt specific config
// To use call ts-node set-config.ts --celo-env YOUR_ENV_NAME --celo-proj YOUR_PROJECT_NAME --testnet-id YOUR_NET_ID --tx-ip YOUR_TX_NODE_IP --tx-port YOUR_RPC_PORT_ON_TX_NODE
// All of these variables must be passed in as arugments.

import { setConfig, setProject } from '@celo/verification-pool-api/deployment/deployment-utils'
import * as parseArgs from 'minimist'

setProject(parseArgs(process.argv.slice(2))['celo-proj'])
setConfig(
  parseArgs(process.argv.slice(2))['celo-env'],
  parseArgs(process.argv.slice(2))['testnet-id'],
  parseArgs(process.argv.slice(2))['tx-ip'],
  parseArgs(process.argv.slice(2))['tx-port'],
  parseArgs(process.argv.slice(2))['app-signature']
)
