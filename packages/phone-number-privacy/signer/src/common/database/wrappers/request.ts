import { DB_TIMEOUT, ErrorMessage, SignMessageRequest } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { Histograms, meter } from '../../metrics'
import { PnpSignRequestRecord, REQUESTS_COLUMNS, toPnpSignRequestRecord } from '../models/request'
import { countAndThrowDBError, tableWithLockForTrx } from '../utils'

function requests(db: Knex, table: string) {
  return db<PnpSignRequestRecord>(table)
}

export async function getRequestExists(
  db: Knex,
  requestsTable: string,
  // TODO EN: revisit passing around specific message objects in the rest of the req/res audit ticket
  request: SignMessageRequest,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<boolean> {
  return meter(
    async () => {
      logger.debug({ request }, 'Checking if request exists')
      const existingRequest = await tableWithLockForTrx(requests(db, requestsTable), trx)
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
  requestsTable: string,
  request: SignMessageRequest,
  logger: Logger,
  trx: Knex.Transaction
): Promise<void> {
  return meter(
    async () => {
      logger.debug({ request }, 'Storing salt request')
      await requests(db, requestsTable)
        .transacting(trx)
        .insert(toPnpSignRequestRecord(request.account, request.blindedQueryPhoneNumber))
        .timeout(DB_TIMEOUT)
    },
    [],
    (err: any) => countAndThrowDBError(err, logger, ErrorMessage.DATABASE_INSERT_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['storeRequest']
  )
}
