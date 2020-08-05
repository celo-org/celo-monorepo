import { ErrorMessage } from '@celo/phone-number-privacy-common'
import { DB_TIMEOUT } from '../../common/constants'
import logger from '../../common/logger'
import { GetBlindedMessageForSaltRequest } from '../../salt-generation/get-salt'
import { getDatabase } from '../database'
import { Request, REQUESTS_COLUMNS, REQUESTS_TABLE } from '../models/request'

function requests() {
  return getDatabase()<Request>(REQUESTS_TABLE)
}

export async function getRequestExists(request: GetBlindedMessageForSaltRequest): Promise<boolean> {
  if (!request.timestamp) return false //TODO(Alec) make timestamps required
  logger.debug('Checking if request exists')
  try {
    const existingRequest = await requests()
      .where(REQUESTS_COLUMNS.timestamp, new Date(request.timestamp as number)) // indexed
      .andWhere(REQUESTS_COLUMNS.address, request.account)
      .andWhere(REQUESTS_COLUMNS.hashedPhoneNumber, request.hashedPhoneNumber as string) // TODO(Alec) why is this not always defined?
      .andWhere(REQUESTS_COLUMNS.blindedQueryPhoneNumber, request.blindedQueryPhoneNumber)
      .first()
    return !!existingRequest
  } catch (e) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE, e)
    return false
  }
}

export async function storeRequest(request: GetBlindedMessageForSaltRequest) {
  logger.debug('Storing salt request')
  try {
    return insertRecord(new Request(request))
  } catch (e) {
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE, e)
    return null
  }
}

async function insertRecord(data: Request) {
  await requests()
    .insert(data)
    .timeout(DB_TIMEOUT)
  return true
}
