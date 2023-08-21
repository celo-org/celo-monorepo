import { getContractKit } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions'
import config from './config'
import { startCombiner } from './server'

require('dotenv').config()

export const combiner = functions
  .region('us-central1')
  .runWith({
    // Keep instances warm for mainnet functions
    // Defined check required for running tests vs. deployment
    // minInstances: 0,
    minInstances: functions.config().service ? Number(functions.config().service.min_instances) : 0,
  })
  .https.onRequest(startCombiner(config, getContractKit(config.blockchain)))
export * from './config'
