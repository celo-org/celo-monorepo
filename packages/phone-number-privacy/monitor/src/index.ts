import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
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
      const odisResponse: PhoneNumberHashDetails = await queryOdisForSalt()
      logger.info({ odisResponse }, 'ODIS salt request successful. System is healthy.')
    } catch (err) {
      if ((err as Error).message === ErrorMessages.ODIS_QUOTA_ERROR) {
        logger.info(
          { error: err },
          'ODIS salt request out of quota. This is expected. System is healthy.'
        )
      } else {
        logger.error('ODIS salt request failed.')
        logger.error({ err })
        throw err
      }
    }
  })
