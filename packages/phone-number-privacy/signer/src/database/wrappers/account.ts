import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Transaction } from 'knex'
import { Counters, Histograms, Labels } from '../../common/metrics'
import { getDatabase } from '../database'
import { Account, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

function accounts() {
  return getDatabase()<Account>(ACCOUNTS_TABLE)
}

/*
 * Returns how many queries the account has already performed.
 */
export async function getPerformedQueryCount(
  account: string,
  logger: Logger,
  trx?: Transaction
): Promise<number> {
  logger.debug({ account }, 'Getting performed query count')
  const getPerformedQueryCountMeter = Histograms.dbOpsInstrumentation
    .labels('getPerformedQueryCount')
    .startTimer()
  try {
    const queryCounts = trx
      ? await accounts()
          .transacting(trx)
          .forUpdate()
          .select(ACCOUNTS_COLUMNS.numLookups)
          .where(ACCOUNTS_COLUMNS.address, account)
          .first()
          .timeout(DB_TIMEOUT)
      : await accounts()
          .select(ACCOUNTS_COLUMNS.numLookups)
          .where(ACCOUNTS_COLUMNS.address, account)
          .first()
          .timeout(DB_TIMEOUT)
    return queryCounts === undefined ? 0 : queryCounts[ACCOUNTS_COLUMNS.numLookups]
  } catch (err) {
    Counters.databaseErrors.labels(Labels.read).inc()
    logger.error({ error: err }, ErrorMessage.DATABASE_GET_FAILURE)
    return 0
  } finally {
    getPerformedQueryCountMeter()
  }
}

async function getAccountExists(
  account: string,
  logger: Logger,
  trx?: Transaction
): Promise<boolean> {
  const getAccountExistsMeter = Histograms.dbOpsInstrumentation
    .labels('getAccountExists')
    .startTimer()
  try {
    const accountRecord = trx
      ? await accounts()
          .transacting(trx)
          .forUpdate()
          .where(ACCOUNTS_COLUMNS.address, account)
          .first()
          .timeout(DB_TIMEOUT)
      : await accounts().where(ACCOUNTS_COLUMNS.address, account).first().timeout(DB_TIMEOUT)
    return !!accountRecord
  } catch (err) {
    Counters.databaseErrors.labels(Labels.read).inc()
    logger.error({ error: err }, ErrorMessage.DATABASE_GET_FAILURE)
    return false
  } finally {
    getAccountExistsMeter()
  }
}

/*
 * Increments query count in database.  If record doesn't exist, create one.
 */
export async function incrementQueryCount(
  account: string,
  logger: Logger,
  trx: Transaction
): Promise<boolean> {
  const incrementQueryCountMeter = Histograms.dbOpsInstrumentation
    .labels('incrementQueryCount')
    .startTimer()
  logger.debug({ account }, 'Incrementing query count')
  try {
    if (await getAccountExists(account, logger, trx)) {
      await accounts()
        .transacting(trx)
        .where(ACCOUNTS_COLUMNS.address, account)
        .increment(ACCOUNTS_COLUMNS.numLookups, 1)
        .timeout(DB_TIMEOUT)
      return true
    } else {
      const newAccount = new Account(account)
      newAccount[ACCOUNTS_COLUMNS.numLookups] = 1
      return insertRecord(newAccount, logger, trx)
    }
  } catch (err) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error({ error: err }, ErrorMessage.DATABASE_UPDATE_FAILURE)
    return false
  } finally {
    incrementQueryCountMeter()
  }
}

async function insertRecord(data: Account, logger: Logger, trx: Transaction) {
  try {
    await accounts().transacting(trx).insert(data).timeout(DB_TIMEOUT)
    return true
  } catch (err) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error({ error: err }, ErrorMessage.DATABASE_UPDATE_FAILURE)
    return false
  }
}
