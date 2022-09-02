import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { Histograms } from '../../../common/metrics'
import { meter } from '../../web3/contracts'
import { Account, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'
import { countAndThrowDBError } from '../utils'

function accounts(db: Knex) {
  return db<Account>(ACCOUNTS_TABLE)
}

/*
 * Returns how many queries the account has already performed.
 * // TODO EN: minimally add comments about locking DB rows if trx does not exist;
 * possibly split this into two separate functions otherwise
 * --> could even do something like split it up into the actual getPerformedQueryCount
 * that requires a trx, and then a wrapper that has separate logging for failing to obtain the lock & transaction
 */
export async function getPerformedQueryCount(
  db: Knex,
  account: string,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<number> {
  return meter(
    async () => {
      logger.debug({ account }, 'Getting performed query count')
      let baseQuery = accounts(db)
      if (trx) {
        // Lock relevant database rows for the duration of the transaction
        baseQuery = baseQuery.transacting(trx).forUpdate()
      }
      const queryCounts = await baseQuery
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
  account: string,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<boolean> {
  return meter(
    async () => {
      let baseQuery = accounts(db)
      if (trx) {
        // Lock relevant database rows for the duration of the trx
        baseQuery = baseQuery.transacting(trx).forUpdate()
      }
      const accountRecord = await baseQuery
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
  account: string,
  logger: Logger,
  trx: Knex.Transaction
): Promise<void> {
  return meter(
    async () => {
      logger.debug({ account }, 'Incrementing query count')
      if (await getAccountExists(db, account, logger, trx)) {
        await accounts(db)
          .transacting(trx)
          .where(ACCOUNTS_COLUMNS.address, account)
          .increment(ACCOUNTS_COLUMNS.numLookups, 1)
          .timeout(DB_TIMEOUT)
      } else {
        const newAccount = new Account(account)
        newAccount[ACCOUNTS_COLUMNS.numLookups] = 1
        await insertRecord(db, newAccount, logger, trx)
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
  data: Account,
  logger: Logger,
  trx: Knex.Transaction
): Promise<void> {
  try {
    await accounts(db).transacting(trx).insert(data).timeout(DB_TIMEOUT)
  } catch (error) {
    countAndThrowDBError(error, logger, ErrorMessage.DATABASE_INSERT_FAILURE)
  }
}
