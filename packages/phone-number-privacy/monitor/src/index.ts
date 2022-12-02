import { CombinerEndpointPNP } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions'
import { testDomainsQuery, testPNPQuery } from './test'

// do not deploy this, since this overwrites the ODIS 1.0 monitor
// export const odisMonitorScheduleFunction = functions
//   .region('us-central1', 'europe-west3')
//   .pubsub.schedule('every 5 minutes')
//   .onRun(testQuery)

const contextName = functions.config().monitor.context_name
const blockchainProvider = functions.config().blockchain.provider
if (!contextName || !blockchainProvider) {
  throw new Error('blockchain provider and context name must be set in function config')
}

export const odisMonitorScheduleFunctionLegacyPNP = functions
  .region('us-central1')
  // .region('us-central1', 'europe-west3')
  .pubsub.schedule('every 5 minutes')
  .onRun(async () =>
    testPNPQuery(blockchainProvider, contextName, CombinerEndpointPNP.LEGACY_PNP_SIGN)
  )

export const odisMonitorScheduleFunctionPNP = functions
  .region('us-central1')
  // .region('us-central1', 'europe-west3')
  .pubsub.schedule('every 5 minutes')
  .onRun(async () => testPNPQuery(blockchainProvider, contextName, CombinerEndpointPNP.PNP_SIGN))

export const odisMonitorScheduleFunctionDomains = functions
  .region('us-central1')
  // .region('us-central1', 'europe-west3')
  .pubsub.schedule('every 5 minutes')
  .onRun(() => testDomainsQuery(contextName))
