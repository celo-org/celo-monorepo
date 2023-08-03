import { ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { config } from '../../../config'
import { Histograms, meter } from '../../metrics'
import {
  PnpSignRequestRecord,
  REQUESTS_COLUMNS,
  REQUESTS_TABLE,
  toPnpSignRequestRecord,
} from '../models/request'
import { countAndThrowDBError, tableWithLockForTrx } from '../utils'

function requests(db: Knex, table: REQUESTS_TABLE) {
  return db<PnpSignRequestRecord>(table)
}

export async function getRequestExists(
  db: Knex,
  requestsTable: REQUESTS_TABLE,
  account: string,
  blindedQuery: string,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<boolean> {
  return meter(
    async () => {
      logger.debug(
        `Checking if request exists for account: ${account}, blindedQuery: ${blindedQuery}`
      )
      const existingRequest = await tableWithLockForTrx(requests(db, requestsTable), trx)
        .where({
          [REQUESTS_COLUMNS.address]: account,
          [REQUESTS_COLUMNS.blindedQuery]: blindedQuery,
        })
        .first()
        .timeout(config.db.timeout)
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
  requestsTable: REQUESTS_TABLE,
  account: string,
  blindedQuery: string,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<void> {
  return meter(
    async () => {
      logger.debug(`Storing salt request for: ${account}, blindedQuery: ${blindedQuery}`)
      await tableWithLockForTrx(requests(db, requestsTable), trx)
        .insert(toPnpSignRequestRecord(account, blindedQuery))
        .timeout(config.db.timeout)
    },
    [],
    (err: any) => countAndThrowDBError(err, logger, ErrorMessage.DATABASE_INSERT_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['storeRequest']
  )
}
