import { ErrorMessages } from '@celo/contractkit/lib/identity/odis/query'
import * as functions from 'firebase-functions'
import { rootLogger } from './logger'
import { queryOdisForSalt } from './query'

export const odisMonitorScheduleFunction = functions
  .region('us-central1', 'europe-west3')
  .pubsub.schedule('every 5 minutes')
  .onRun(async () => {
    rootLogger.info('Performing test query')
    try {
      const res = await queryOdisForSalt()
      rootLogger.info(res, 'ODIS salt request successful. System is healthy.')
    } catch (e) {
      if ((e as Error).message === ErrorMessages.ODIS_QUOTA_ERROR) {
        rootLogger.info(
          { e },
          'ODIS salt request out of quota. This is expected. System is healthy.'
        )
      } else {
        rootLogger.error({ e }, 'ODIS salt request failed.')
        throw e
      }
    }
  })
