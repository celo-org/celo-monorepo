import { CombinerEndpointPNP } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions'
import { testDomainSignQuery, testPNPSignQuery } from './test'

const contextName = functions.config().monitor.context_name
const blockchainProvider = functions.config().blockchain.provider
if (!contextName || !blockchainProvider) {
  throw new Error('blockchain provider and context name must be set in function config')
}

// New functions do not overwrite ODIS 1.0 monitor function.
export const odisMonitorScheduleFunctionLegacyPNP = functions
  .region('us-central1')
  .pubsub.schedule('every 5 minutes')
  .onRun(async () =>
    testPNPSignQuery(blockchainProvider, contextName, CombinerEndpointPNP.LEGACY_PNP_SIGN)
  )

export const odisMonitorScheduleFunctionPNP = functions
  .region('us-central1')
  .pubsub.schedule('every 5 minutes')
  .onRun(async () =>
    testPNPSignQuery(blockchainProvider, contextName, CombinerEndpointPNP.PNP_SIGN)
  )

export const odisMonitorScheduleFunctionDomains = functions
  .region('us-central1')
  .pubsub.schedule('every 5 minutes')
  .onRun(async () => testDomainSignQuery(contextName))
