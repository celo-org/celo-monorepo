import { DB_TIMEOUT, ErrorMessage, logger } from '@celo/phone-number-privacy-common'
import { GetBlindedMessagePartialSigRequest } from '../../signing/get-partial-signature'
import { getDatabase } from '../database'
import { Request, REQUESTS_COLUMNS, REQUESTS_TABLE } from '../models/request'

function requests() {
  return getDatabase()<Request>(REQUESTS_TABLE)
}

export async function getRequestExists(
  request: GetBlindedMessagePartialSigRequest
): Promise<boolean> {
  if (!request.timestamp) {
    logger.debug('request does not have timestamp')
    return false // TODO(Alec) make timestamps required
  }
  logger.debug({ request }, 'Checking if request exists')
  try {
    const existingRequest = await requests()
      .where({
        [REQUESTS_COLUMNS.timestamp]: new Date(request.timestamp as number),
        [REQUESTS_COLUMNS.address]: request.account,
        [REQUESTS_COLUMNS.blindedQuery]: request.blindedQueryPhoneNumber,
      })
      .first()
    return !!existingRequest
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error({ err })
    return false
  }
}

export async function storeRequest(request: GetBlindedMessagePartialSigRequest) {
  if (!request.timestamp) {
    logger.debug('request does not have timestamp')
    return true // TODO remove once backwards compatibility isn't necessary
  }
  logger.debug({ request }, 'Storing salt request')
  try {
    await requests()
      .insert(new Request(request))
      .timeout(DB_TIMEOUT)
    return true
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error({ err })
    return null
  }
}
