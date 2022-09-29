import { DB_TIMEOUT, ErrorMessage, SignMessageRequest } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { Histograms, meter } from '../../metrics'
import { Request, REQUESTS_COLUMNS, REQUESTS_TABLE } from '../models/request'
import { countAndThrowDBError, tableWithLockForTrx } from '../utils'

function requests(db: Knex) {
  return db<Request>(REQUESTS_TABLE)
}

export async function getRequestExists(
  db: Knex,
  request: SignMessageRequest,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<boolean> {
  return meter(
    async () => {
      logger.debug({ request }, 'Checking if request exists')
      const existingRequest = await tableWithLockForTrx(requests(db), trx)
        .where({
          [REQUESTS_COLUMNS.address]: request.account,
          [REQUESTS_COLUMNS.blindedQuery]: request.blindedQueryPhoneNumber,
        })
        .first()
        .timeout(DB_TIMEOUT)
      return !!existingRequest
    },
    [],
    (err: any) => countAndThrowDBError<boolean>(err, logger, ErrorMessage.DATABASE_GET_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['getRequestExists']
  )
}

export async function storeRequest(
  db: Knex,
  request: SignMessageRequest,
  logger: Logger,
  trx: Knex.Transaction
): Promise<void> {
  return meter(
    async () => {
      logger.debug({ request }, 'Storing salt request')
      await requests(db).transacting(trx).insert(new Request(request)).timeout(DB_TIMEOUT)
    },
    [],
    (err: any) => countAndThrowDBError(err, logger, ErrorMessage.DATABASE_INSERT_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['storeRequest']
  )
}
