import { getContractKitWithAgent } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions'
import config from './config'
import { startCombiner, startProxy } from './server'

require('dotenv').config()

export const combiner = functions
  .region('us-central1')
  .runWith({
    // Keep instances warm for mainnet functions
    // Defined check required for running tests vs. deployment
    minInstances: functions.config().service ? Number(functions.config().service.min_instances) : 0,
  })
  .https.onRequest((req, res) => {
    if (config.proxy.forwardToGen2) {
      startProxy(req, res, config)
    } else {
      const app = startCombiner(config, getContractKitWithAgent(config.blockchain))
      app(req, res)
    }
  })
export * from './config'
