import { ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { config } from '../../../config'
import { Histograms, newMeter } from '../../metrics'
import {
  PnpSignRequestRecord,
  REQUESTS_COLUMNS,
  REQUESTS_TABLE,
  toPnpSignRequestRecord,
} from '../models/request'
import { countAndThrowDBError, queryWithOptionalTrx } from '../utils'

function requests(db: Knex, table: REQUESTS_TABLE) {
  return db<PnpSignRequestRecord>(table)
}

const getRequestExistsMeter = newMeter(Histograms.dbOpsInstrumentation, 'getRequestExists')

export async function getRequestExists( // TODO try insert, if primary key error, then duplicate request
  db: Knex,
  requestsTable: REQUESTS_TABLE,
  account: string,
  blindedQuery: string,
  logger: Logger
): Promise<boolean> {
  return getRequestExistsMeter(async () => {
    try {
      logger.debug(
        `Checking if request exists for account: ${account}, blindedQuery: ${blindedQuery}`
      )
      const existingRequest = await requests(db, requestsTable)
        .where({
          [REQUESTS_COLUMNS.address]: account,
          [REQUESTS_COLUMNS.blindedQuery]: blindedQuery, // TODO are we using the primary key correctly??
        })
        .first()
        .timeout(config.db.timeout)
      return !!existingRequest
    } catch (err: any) {
      return countAndThrowDBError<boolean>(err, logger, ErrorMessage.DATABASE_GET_FAILURE)
    }
  })
}

export async function storeRequest(
  db: Knex,
  requestsTable: REQUESTS_TABLE,
  account: string,
  blindedQuery: string,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<void> {
  const meter = newMeter(Histograms.dbOpsInstrumentation, 'storeRequest')
  return meter(async () => {
    try {
      logger.debug(`Storing salt request for: ${account}, blindedQuery: ${blindedQuery}`)
      await queryWithOptionalTrx(requests(db, requestsTable), trx)
        .insert(toPnpSignRequestRecord(account, blindedQuery))
        .timeout(config.db.timeout)
    } catch (err: any) {
      return countAndThrowDBError(err, logger, ErrorMessage.DATABASE_INSERT_FAILURE)
    }
  })
}
