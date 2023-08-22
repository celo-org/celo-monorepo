import { getContractKit } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2'
import { defineInt } from 'firebase-functions/params'
import config from './config'
import { startCombiner } from './server'

require('dotenv').config()

setGlobalOptions({ region: 'us-central1' })

const minInstances = defineInt('MIN_INSTANCES', { default: 0 })
export const combinerGen2 = functions.onRequest(
  { minInstances: minInstances },
  startCombiner(config, getContractKit(config.blockchain))
)
export * from './config'
