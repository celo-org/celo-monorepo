import { DB_TIMEOUT, ErrorMessage, SignMessageRequest } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { Counters, Histograms, Labels } from '../../common/metrics'
import { Request, REQUESTS_COLUMNS, REQUESTS_TABLE } from '../models/request'

function requests(db: Knex) {
  return db<Request>(REQUESTS_TABLE)
}

export async function getRequestExists(
  db: Knex,
  request: SignMessageRequest,
  logger: Logger,
  trx: Knex.Transaction
): Promise<boolean> {
  logger.debug({ request }, 'Checking if request exists')
  const getRequestExistsMeter = Histograms.dbOpsInstrumentation
    .labels('getRequestExists')
    .startTimer()
  try {
    const existingRequest = await requests(db)
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
  db: Knex,
  request: SignMessageRequest,
  logger: Logger,
  trx: Knex.Transaction
) {
  const storeRequestMeter = Histograms.dbOpsInstrumentation.labels('storeRequest').startTimer()
  logger.debug({ request }, 'Storing salt request')
  try {
    await requests(db).transacting(trx).insert(new Request(request)).timeout(DB_TIMEOUT)
    return true
  } catch (err) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error({ error: err }, ErrorMessage.DATABASE_UPDATE_FAILURE)
    return null
  } finally {
    storeRequestMeter()
  }
}
