import * as functions from 'firebase-functions/v2/https'
import config from './config'
import { startCombiner } from './server'
import { blockchainApiKey, minInstancesConfig, requestConcurency } from './utils/firebase-configs'

require('dotenv').config()

export const combinerGen2 = functions.onRequest(
  {
    minInstances: minInstancesConfig,
    secrets: [blockchainApiKey],
    concurrency: requestConcurency,
    memory: '512MiB',
    region: 'us-central1',
  },
  startCombiner(config)
)
export * from './config'
