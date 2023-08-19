import { ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { config } from '../../../config'
import { AccountRecord, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE, toAccountRecord } from '../models/account'
import { doMeteredSql } from '../utils'

/*
 * Returns how many queries the account has already performed.
 */
export async function getPerformedQueryCount(
  db: Knex,
  account: string,
  logger: Logger
): Promise<number> {
  logger.debug({ account }, 'Getting performed query count')
  return doMeteredSql(
    'getPerformedQueryCount',
    ErrorMessage.DATABASE_GET_FAILURE,
    logger,
    async () => {
      const queryCounts = await db<AccountRecord>(ACCOUNTS_TABLE)
        .where(ACCOUNTS_COLUMNS.address, account)
        .select(ACCOUNTS_COLUMNS.numLookups)
        .first()
        .timeout(config.db.timeout)
      return queryCounts === undefined ? 0 : queryCounts[ACCOUNTS_COLUMNS.numLookups]
    }
  )
}

async function getAccountExists(
  db: Knex,
  account: string,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<boolean> {
  return doMeteredSql('getAccountExists', ErrorMessage.DATABASE_GET_FAILURE, logger, async () => {
    const sql = db<AccountRecord>(ACCOUNTS_TABLE)
      .where(ACCOUNTS_COLUMNS.address, account)
      .first()
      .timeout(config.db.timeout)

    const accountRecord = await (trx != null ? sql.transacting(trx) : sql)
    return !!accountRecord
  })
}

/*
 * Increments query count in database.  If record doesn't exist, create one.
 */
export async function incrementQueryCount(
  db: Knex,
  account: string,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<void> {
  logger.debug({ account }, 'Incrementing query count')
  return doMeteredSql(
    'incrementQueryCount',
    ErrorMessage.DATABASE_INSERT_FAILURE,
    logger,
    async () => {
      if (await getAccountExists(db, account, logger, trx)) {
        const sql = db<AccountRecord>(ACCOUNTS_TABLE)
          .where(ACCOUNTS_COLUMNS.address, account)
          .increment(ACCOUNTS_COLUMNS.numLookups, 1)
          .timeout(config.db.timeout)
        await (trx != null ? sql.transacting(trx) : sql)
      } else {
        const sql = db<AccountRecord>(ACCOUNTS_TABLE)
          .insert(toAccountRecord(account, 1))
          .timeout(config.db.timeout)
        await (trx != null ? sql.transacting(trx) : sql)
      }
    }
  )
}
