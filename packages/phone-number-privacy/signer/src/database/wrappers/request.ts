import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Transaction } from 'knex'
import { Counters, Histograms, Labels } from '../../common/metrics'
import { GetBlindedMessagePartialSigRequest } from '../../signing/get-partial-signature'
import { getDatabase } from '../database'
import { Request, REQUESTS_COLUMNS, REQUESTS_TABLE } from '../models/request'

function requests() {
  return getDatabase()<Request>(REQUESTS_TABLE)
}

export async function getRequestExists(
  request: GetBlindedMessagePartialSigRequest,
  logger: Logger,
  trx: Transaction
): Promise<boolean> {
  logger.debug({ request }, 'Checking if request exists')
  const getRequestExistsMeter = Histograms.dbOpsInstrumentation
    .labels('getRequestExists')
    .startTimer()
  try {
    const existingRequest = await requests()
      .transacting(trx)
      .where({
        [REQUESTS_COLUMNS.address]: request.account,
        [REQUESTS_COLUMNS.blindedQuery]: request.blindedQueryPhoneNumber,
      })
      .first()
      .timeout(DB_TIMEOUT)
    return !!existingRequest
  } catch (err) {
    Counters.databaseErrors.labels(Labels.read).inc()
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    return false
  } finally {
    getRequestExistsMeter()
  }
}

export async function storeRequest(
  request: GetBlindedMessagePartialSigRequest,
  logger: Logger,
  trx: Transaction
) {
  const storeRequestMeter = Histograms.dbOpsInstrumentation.labels('storeRequest').startTimer()
  logger.debug({ request }, 'Storing salt request')
  try {
    await requests().transacting(trx).insert(new Request(request)).timeout(DB_TIMEOUT)
    return true
  } catch (err) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error({ error: err }, ErrorMessage.DATABASE_UPDATE_FAILURE)
    return null
  } finally {
    storeRequestMeter()
  }
}
