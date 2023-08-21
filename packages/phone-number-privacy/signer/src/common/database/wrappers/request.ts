// import { ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
// import { config } from '../../../config'
// import {
//   PnpSignRequestRecord,
//   // REQUESTS_COLUMNS,
//   REQUESTS_TABLE,
//   toPnpSignRequestRecord,
// } from '../models/request'
// import { doMeteredSql } from '../utils'

export async function getRequestExists( // TODO try insert, if primary key error, then duplicate request
  _db: Knex,
  _account: string,
  _blindedQuery: string,
  _logger: Logger
): Promise<boolean> {
  return Promise.resolve(false)
  // logger.debug(`Checking if request exists for account: ${account}, blindedQuery: ${blindedQuery}`)
  // return doMeteredSql('getRequestExists', ErrorMessage.DATABASE_GET_FAILURE, logger, async () => {
  //   const existingRequest = await db<PnpSignRequestRecord>(REQUESTS_TABLE)
  //     .where({
  //       [REQUESTS_COLUMNS.address]: account,
  //       [REQUESTS_COLUMNS.blindedQuery]: blindedQuery, // TODO are we using the primary key correctly??
  //     })
  //     .first()
  //     .timeout(config.db.timeout)
  //   return !!existingRequest // TODO use EXISTS query??
  // })
}

export async function insertRequest(
  _db: Knex,
  _account: string,
  _blindedQuery: string,
  _logger: Logger,
  _trx?: Knex.Transaction
): Promise<void> {
  return
  // logger.debug(`Storing salt request for: ${account}, blindedQuery: ${blindedQuery}`)
  // return doMeteredSql('insertRequest', ErrorMessage.DATABASE_INSERT_FAILURE, logger, async () => {
  //   const sql = db<PnpSignRequestRecord>(REQUESTS_TABLE)
  //     .insert(toPnpSignRequestRecord(account, blindedQuery))
  //     .timeout(config.db.timeout)
  //   await (trx != null ? sql.transacting(trx) : sql)
  // })
}
