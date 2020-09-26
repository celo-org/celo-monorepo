import { ErrorMessages } from '@celo/contractkit/lib/identity/odis/query'
import { logger } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions'
import { queryOdisForSalt } from './query'

export const odisMonitorScheduleFunction = functions
  .region('us-central1', 'europe-west3')
  .pubsub.schedule('every 5 minutes')
  .onRun(async () => {
    logger.info('Performing test query')
    try {
      const res = await queryOdisForSalt()
      logger.info({ res }, 'ODIS salt request successful. System is healthy.')
    } catch (e) {
      if ((e as Error).message === ErrorMessages.ODIS_QUOTA_ERROR) {
        logger.info({ e }, 'ODIS salt request out of quota. This is expected. System is healthy.')
      } else {
        logger.error({ e }, 'ODIS salt request failed.')
        throw e
      }
    }
  })
