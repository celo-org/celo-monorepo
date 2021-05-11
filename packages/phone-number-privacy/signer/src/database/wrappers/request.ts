import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Counters, Histograms, Labels } from '../../common/metrics'
import { GetBlindedMessagePartialSigRequest } from '../../signing/get-partial-signature'
import { getDatabase } from '../database'
import { Request, REQUESTS_COLUMNS, REQUESTS_TABLE } from '../models/request'

function requests() {
  return getDatabase()<Request>(REQUESTS_TABLE)
}

export async function getRequestExists(
  request: GetBlindedMessagePartialSigRequest,
  logger: Logger
): Promise<boolean> {
  if (!request.timestamp) {
    logger.debug('request does not have timestamp')
    return false
  }
  logger.debug({ request }, 'Checking if request exists')
  const getRequestExistsMeter = Histograms.dbOpsInstrumentation
    .labels('getRequestExists')
    .startTimer()
  try {
    const existingRequest = await requests()
      .where({
        [REQUESTS_COLUMNS.timestamp]: new Date(request.timestamp as number),
        [REQUESTS_COLUMNS.address]: request.account,
        [REQUESTS_COLUMNS.blindedQuery]: request.blindedQueryPhoneNumber,
      })
      .first()
      .timeout(DB_TIMEOUT)
    getRequestExistsMeter()
    return !!existingRequest
  } catch (err) {
    Counters.databaseErrors.labels(Labels.read).inc()
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    getRequestExistsMeter()
    return false
  }
}

export async function storeRequest(request: GetBlindedMessagePartialSigRequest, logger: Logger) {
  if (!request.timestamp) {
    logger.debug('request does not have timestamp')
    return true
  }
  const storeRequestMeter = Histograms.dbOpsInstrumentation.labels('storeRequest').startTimer()
  logger.debug({ request }, 'Storing salt request')
  try {
    await requests().insert(new Request(request)).timeout(DB_TIMEOUT)
    storeRequestMeter()
    return true
  } catch (err) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error(err)
    storeRequestMeter()
    return null
  }
}
