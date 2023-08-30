import * as functions from 'firebase-functions'
import { testDomainSignQuery, testPNPSignQuery } from './test'

const contextName = functions.config().monitor.context_name
const blockchainProvider = functions.config().blockchain.provider
if (!contextName || !blockchainProvider) {
  throw new Error('blockchain provider and context name must be set in function config')
}

export const odisMonitorScheduleFunctionPNP = functions
  .region('us-central1')
  .pubsub.schedule('every 5 minutes')
  .onRun(async () => testPNPSignQuery(blockchainProvider, contextName))

export const odisMonitorScheduleFunctionDomains = functions
  .region('us-central1')
  .pubsub.schedule('every 5 minutes')
  .onRun(async () => testDomainSignQuery(contextName))
