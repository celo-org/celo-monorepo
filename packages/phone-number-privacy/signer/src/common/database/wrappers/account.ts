import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { Histograms, meter } from '../../metrics'
import { AccountRecord, ACCOUNTS_COLUMNS, toAccountRecord } from '../models/account'
import { countAndThrowDBError, tableWithLockForTrx } from '../utils'

function accounts(db: Knex, table: string) {
  return db<AccountRecord>(table)
}

/*
 * Returns how many queries the account has already performed.
 */
export async function getPerformedQueryCount(
  db: Knex,
  accountsTable: string,
  account: string,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<number> {
  return meter(
    async () => {
      logger.debug({ account }, 'Getting performed query count')
      const queryCounts = await tableWithLockForTrx(accounts(db, accountsTable), trx)
        .select(ACCOUNTS_COLUMNS.numLookups)
        .where(ACCOUNTS_COLUMNS.address, account)
        .first()
        .timeout(DB_TIMEOUT)
      return queryCounts === undefined ? 0 : queryCounts[ACCOUNTS_COLUMNS.numLookups]
    },
    [],
    (err: any) => countAndThrowDBError<number>(err, logger, ErrorMessage.DATABASE_GET_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['getPerformedQueryCount']
  )
}

async function getAccountExists(
  db: Knex,
  accountsTable: string,
  account: string,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<boolean> {
  return meter(
    async () => {
      const accountRecord = await tableWithLockForTrx(accounts(db, accountsTable), trx)
        .where(ACCOUNTS_COLUMNS.address, account)
        .first()
        .timeout(DB_TIMEOUT)

      return !!accountRecord
    },
    [],
    (err: any) => countAndThrowDBError<boolean>(err, logger, ErrorMessage.DATABASE_GET_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['getAccountExists']
  )
}

/*
 * Increments query count in database.  If record doesn't exist, create one.
 */
export async function incrementQueryCount(
  db: Knex,
  accountsTable: string,
  account: string,
  logger: Logger,
  trx: Knex.Transaction
): Promise<void> {
  return meter(
    async () => {
      logger.debug({ account }, 'Incrementing query count')
      if (await getAccountExists(db, accountsTable, account, logger, trx)) {
        await accounts(db, accountsTable)
          .transacting(trx)
          .where(ACCOUNTS_COLUMNS.address, account)
          .increment(ACCOUNTS_COLUMNS.numLookups, 1)
          .timeout(DB_TIMEOUT)
      } else {
        const newAccountRecord = toAccountRecord(account, 1)
        await insertRecord(db, accountsTable, newAccountRecord, logger, trx)
      }
    },
    [],
    (err: any) => countAndThrowDBError(err, logger, ErrorMessage.DATABASE_UPDATE_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['incrementQueryCount']
  )
}

async function insertRecord(
  db: Knex,
  accountsTable: string,
  data: AccountRecord,
  logger: Logger,
  trx: Knex.Transaction
): Promise<void> {
  try {
    await accounts(db, accountsTable).transacting(trx).insert(data).timeout(DB_TIMEOUT)
  } catch (error) {
    countAndThrowDBError(error, logger, ErrorMessage.DATABASE_INSERT_FAILURE)
  }
}
