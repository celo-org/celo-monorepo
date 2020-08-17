import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import logger from '../../common/logger'
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
    return false // TODO(Alec) make timestamps required
  }
  logger.debug('Checking if request exists')
  try {
    const existingRequest = await requests()
      .where({
        [REQUESTS_COLUMNS.timestamp]: new Date(request.timestamp as number),
        [REQUESTS_COLUMNS.address]: request.account,
        [REQUESTS_COLUMNS.blindedQuery]: request.blindedQueryPhoneNumber,
      })
      .first()
    return !!existingRequest
  } catch (e) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE, e)
    return false
  }
}

export async function storeRequest(request: GetBlindedMessagePartialSigRequest) {
  logger.debug('Storing salt request')
  try {
    await requests()
      .insert(new Request(request))
      .timeout(DB_TIMEOUT)
    return true
  } catch (e) {
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE, e)
    return null
  }
}
