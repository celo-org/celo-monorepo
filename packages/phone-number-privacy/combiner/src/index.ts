import { getContractKitWithAgent } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions'
import { Knex } from 'knex'
import config from './config'
import { initDatabase } from './database/database'
import { startCombiner } from './server'

require('dotenv').config()

export const combiner = functions
  .region('us-central1')
  .runWith({
    // Keep instances warm for mainnet functions
    // Defined check required for running tests vs. deployment
    minInstances: functions.config().service ? Number(functions.config().service.min_instances) : 0,
  })
  .https.onRequest(async (req, res) => {
    try {
      const db: Knex = await initDatabase(config)
      const app = startCombiner(db, config, getContractKitWithAgent(config.blockchain))

      app(req, res)
    } catch (e) {
      res.status(500).send('Internal Server Error')
    }
  })
export * from './config'
