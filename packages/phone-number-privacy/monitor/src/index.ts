import * as functions from 'firebase-functions'
import { testQuery } from './test'

const haveConfig = !!functions.config().blockchain
export const network = haveConfig ? functions.config().blockchain.network : process.env.NETWORK
export const blockchainProvider: string = haveConfig
  ? functions.config().blockchain.provider
  : process.env.BLOCKCHAIN_PROVIDER

export const odisMonitorScheduleFunction = functions
  .region('us-central1', 'europe-west3')
  .pubsub.schedule('every 5 minutes')
  .onRun(testQuery)
