import { getContractKit } from '@celo/phone-number-privacy-common'
import { setGlobalOptions } from 'firebase-functions/v2'
import * as functions from 'firebase-functions/v2/https'
import config from './config'
import { startCombiner } from './server'
import { blockchainApiKey, minInstancesConfig } from './utils/firebase-configs'

require('dotenv').config()

setGlobalOptions({ region: 'us-central1' })

export const combinerGen2 = functions.onRequest(
  { minInstances: minInstancesConfig, secrets: [blockchainApiKey] },
  startCombiner(config, getContractKit(config.blockchain))
)
export * from './config'
