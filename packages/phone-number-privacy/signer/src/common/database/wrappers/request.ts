import { DB_TIMEOUT, ErrorMessage, SignMessageRequest } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { Histograms, meter } from '../../metrics'
import { PnpSignRequestRecord, REQUESTS_COLUMNS, toPnpSignRequestRecord } from '../models/request'
import { countAndThrowDBError, tableWithLockForTrx } from '../utils'

// TODO EN: remove default table params
function requests(db: Knex, table: string) {
  return db<PnpSignRequestRecord>(table)
}

export async function getRequestExists(
  db: Knex,
  requestTable: string,
  // TODO EN: ideally make these functions not depend on the request format nor the table name
  // TODO EN: couuld always create a separate interface for the data needed for the request queries
  // NOTE EN: do thisi later and just do it once later
  // then could easily have subclasses (legacy/new) create something that transforms a session.body -> DB_FIELDS
  // account: string,
  // blindedQuery: string,
  request: SignMessageRequest,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<boolean> {
  return meter(
    async () => {
      logger.debug({ request }, 'Checking if request exists')
      // logger.debug(
      //   `Checking if request exists for account: ${account}, blindedQuery: ${blindedQuery} `
      // )
      const existingRequest = await tableWithLockForTrx(requests(db, requestTable), trx)
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
  requestTable: string,
  request: SignMessageRequest,
  logger: Logger,
  trx: Knex.Transaction
): Promise<void> {
  return meter(
    async () => {
      logger.debug({ request }, 'Storing salt request')
      await requests(db, requestTable)
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
