import { ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { config } from '../../../config'
import { Histograms, newMeter } from '../../metrics'
import { AccountRecord, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE, toAccountRecord } from '../models/account'
import { countAndThrowDBError, queryWithOptionalTrx } from '../utils'

function accounts(db: Knex, table: ACCOUNTS_TABLE) {
  return db<AccountRecord>(table)
}

/*
 * Returns how many queries the account has already performed.
 */
export async function getPerformedQueryCount(
  db: Knex,
  accountsTable: ACCOUNTS_TABLE,
  account: string,
  logger: Logger
): Promise<number> {
  const _meter = newMeter(Histograms.dbOpsInstrumentation, 'getPerformedQueryCount')
  return _meter(async () => {
    try {
      logger.debug({ account }, 'Getting performed query count')
      const queryCounts = await accounts(db, accountsTable)
        .select(ACCOUNTS_COLUMNS.numLookups)
        .where(ACCOUNTS_COLUMNS.address, account)
        .first()
        .timeout(config.db.timeout)
      return queryCounts === undefined ? 0 : queryCounts[ACCOUNTS_COLUMNS.numLookups]
    } catch (err: any) {
      return countAndThrowDBError<number>(err, logger, ErrorMessage.DATABASE_GET_FAILURE)
    }
  })
}

async function getAccountExists(
  db: Knex,
  accountsTable: ACCOUNTS_TABLE,
  account: string,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<boolean> {
  const _meter = newMeter(Histograms.dbOpsInstrumentation, 'getAccountExists')
  return _meter(async () => {
    try {
      const accountRecord = await queryWithOptionalTrx(accounts(db, accountsTable), trx)
        .where(ACCOUNTS_COLUMNS.address, account)
        .first()
        .timeout(config.db.timeout)
      return !!accountRecord
    } catch (err: any) {
      return countAndThrowDBError<boolean>(err, logger, ErrorMessage.DATABASE_GET_FAILURE)
    }
  })
}

/*
 * Increments query count in database.  If record doesn't exist, create one.
 */
export async function incrementQueryCount(
  db: Knex,
  accountsTable: ACCOUNTS_TABLE,
  account: string,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<void> {
  const _meter = newMeter(Histograms.dbOpsInstrumentation, 'getAccountExists')
  return _meter(async () => {
    try {
      logger.debug({ account }, 'Incrementing query count')
      if (await getAccountExists(db, accountsTable, account, logger, trx)) {
        await queryWithOptionalTrx(accounts(db, accountsTable), trx)
          .where(ACCOUNTS_COLUMNS.address, account)
          .increment(ACCOUNTS_COLUMNS.numLookups, 1)
          .timeout(config.db.timeout)
      } else {
        const newAccountRecord = toAccountRecord(account, 1)
        await insertRecord(db, accountsTable, newAccountRecord, logger, trx)
      }
    } catch (err: any) {
      return countAndThrowDBError(err, logger, ErrorMessage.DATABASE_UPDATE_FAILURE)
    }
  })
}

async function insertRecord(
  db: Knex,
  accountsTable: ACCOUNTS_TABLE,
  data: AccountRecord,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<void> {
  try {
    await queryWithOptionalTrx(accounts(db, accountsTable), trx)
      .insert(data)
      .timeout(config.db.timeout)
  } catch (error) {
    countAndThrowDBError(error, logger, ErrorMessage.DATABASE_INSERT_FAILURE)
  }
}
