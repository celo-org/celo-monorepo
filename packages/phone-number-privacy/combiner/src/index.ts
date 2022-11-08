import { getContractKit } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions'
import config from './config'
import { startCombiner } from './server'

require('dotenv').config()

export const combiner = functions
  .region('us-central1', 'europe-west3')
  .runWith(config.cloudFunction)
  .https.onRequest(startCombiner(config, getContractKit(config.blockchain)))
export * from './config'
