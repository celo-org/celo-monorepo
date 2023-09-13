import { ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { config } from '../../../config'
import {
  PnpSignRequestRecord,
  REQUESTS_COLUMNS,
  REQUESTS_TABLE,
  toPnpSignRequestRecord,
} from '../models/request'
import { doMeteredSql } from '../utils'

export async function getRequestIfExists(
  db: Knex,
  account: string,
  blindedQuery: string,
  logger: Logger
): Promise<PnpSignRequestRecord | undefined> {
  logger.debug(`Checking if request exists for account: ${account}, blindedQuery: ${blindedQuery}`)
  return doMeteredSql('getRequestIfExists', ErrorMessage.DATABASE_GET_FAILURE, logger, async () => {
    const existingRequest = await db<PnpSignRequestRecord>(REQUESTS_TABLE)
      .where({
        [REQUESTS_COLUMNS.address]: account,
        [REQUESTS_COLUMNS.blindedQuery]: blindedQuery,
      })
      .first()
      .timeout(config.db.timeout)
    return existingRequest
  })
}

export async function insertRequest(
  db: Knex,
  account: string,
  blindedQuery: string,
  signature: string,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<void> {
  logger.debug(
    `Storing salt request for: ${account}, blindedQuery: ${blindedQuery}, signature: ${signature}`
  )
  return doMeteredSql('insertRequest', ErrorMessage.DATABASE_INSERT_FAILURE, logger, async () => {
    const sql = db<PnpSignRequestRecord>(REQUESTS_TABLE)
      .insert(toPnpSignRequestRecord(account, blindedQuery, signature))
      .timeout(config.db.timeout)
    await (trx != null ? sql.transacting(trx) : sql)
  })
}

export async function deleteRequestsOlderThan(
  db: Knex,
  since: Date,
  logger: Logger
): Promise<number> {
  logger.debug(`Removing request older than: ${since}`)
  if (since > new Date(Date.now())) {
    logger.debug('Date is in the future')
    return 0
  }
  return doMeteredSql(
    'deleteRequestsOlderThan',
    ErrorMessage.DATABASE_REMOVE_FAILURE,
    logger,
    async () => {
      const sql = db<PnpSignRequestRecord>(REQUESTS_TABLE)
        .where(REQUESTS_COLUMNS.timestamp, '<=', since)
        .del()
      return sql
    }
  )
}
