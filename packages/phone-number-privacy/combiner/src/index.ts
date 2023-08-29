import { getContractKitWithAgent } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions/v2/https'
import { Knex } from 'knex'
import config from './config'
import { initDatabase } from './database/database'
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
  async (req, res) => {
    try {
      const db: Knex = await initDatabase(config)
      const app = startCombiner(db, config, getContractKitWithAgent(config.blockchain))

      app(req, res)
    } catch (e) {
      res.status(500).send('Internal Server Error')
    }
  }
)
export * from './config'
