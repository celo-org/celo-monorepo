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

export async function getRequestExists( // TODO try insert, if primary key error, then duplicate request
  db: Knex,
  account: string,
  blindedQuery: string,
  logger: Logger
): Promise<boolean> {
  logger.debug(`Checking if request exists for account: ${account}, blindedQuery: ${blindedQuery}`)
  return doMeteredSql('getRequestExists', ErrorMessage.DATABASE_GET_FAILURE, logger, async () => {
    const existingRequest = await db<PnpSignRequestRecord>(REQUESTS_TABLE)
      .where({
        [REQUESTS_COLUMNS.address]: account,
        [REQUESTS_COLUMNS.blindedQuery]: blindedQuery, // TODO are we using the primary key correctly??
      })
      .first()
      .timeout(config.db.timeout)
    return !!existingRequest
  })
}

export async function insertRequest(
  db: Knex,
  account: string,
  blindedQuery: string,
  logger: Logger,
  trx: Knex.Transaction
): Promise<number[]> {
  logger.debug(`Storing salt request for: ${account}, blindedQuery: ${blindedQuery}`)
  return doMeteredSql('insertRequest', ErrorMessage.DATABASE_INSERT_FAILURE, logger, () =>
    db<PnpSignRequestRecord>(REQUESTS_TABLE)
      .insert(toPnpSignRequestRecord(account, blindedQuery))
      .timeout(config.db.timeout)
      .transacting(trx)
  )
}
