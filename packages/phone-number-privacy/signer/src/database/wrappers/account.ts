import { DB_TIMEOUT, ErrorMessage, logger } from '@celo/phone-number-privacy-common'
import { getDatabase } from '../database'
import { Account, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

function accounts() {
  return getDatabase()<Account>(ACCOUNTS_TABLE)
}

/*
 * Returns how many queries the account has already performed.
 */
export async function getPerformedQueryCount(account: string): Promise<number> {
  logger.debug({ account }, 'Getting performed query count')
  try {
    const queryCounts = await accounts()
      .select(ACCOUNTS_COLUMNS.numLookups)
      .where(ACCOUNTS_COLUMNS.address, account)
      .first()
    return queryCounts === undefined ? 0 : queryCounts[ACCOUNTS_COLUMNS.numLookups]
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error({ err })
    return 0
  }
}

async function getAccountExists(account: string): Promise<boolean> {
  const existingAccountRecord = await accounts()
    .where(ACCOUNTS_COLUMNS.address, account)
    .first()
  return !!existingAccountRecord
}

/*
 * Increments query count in database.  If record doesn't exist, create one.
 */
export async function incrementQueryCount(account: string) {
  logger.debug({ account }, 'Incrementing query count')
  try {
    if (await getAccountExists(account)) {
      await accounts()
        .where(ACCOUNTS_COLUMNS.address, account)
        .increment(ACCOUNTS_COLUMNS.numLookups, 1)
      return true
    } else {
      const newAccount = new Account(account)
      newAccount[ACCOUNTS_COLUMNS.numLookups] = 1
      return insertRecord(newAccount)
    }
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error({ err })
    return null
  }
}

/*
 * Returns whether account has already performed matchmaking
 */
export async function getDidMatchmaking(account: string): Promise<boolean> {
  try {
    const didMatchmaking = await accounts()
      .where(ACCOUNTS_COLUMNS.address, account)
      .select(ACCOUNTS_COLUMNS.didMatchmaking)
      .first()
    if (!didMatchmaking) {
      return false
    }
    return !!didMatchmaking[ACCOUNTS_COLUMNS.didMatchmaking]
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error({ err })
    return false
  }
}

/*
 * Set did matchmaking to true in database.  If record doesn't exist, create one.
 */
export async function setDidMatchmaking(account: string) {
  logger.debug({ account }, 'Setting did matchmaking')
  try {
    if (await getAccountExists(account)) {
      return accounts()
        .where(ACCOUNTS_COLUMNS.address, account)
        .update(ACCOUNTS_COLUMNS.didMatchmaking, new Date())
    } else {
      const newAccount = new Account(account)
      newAccount[ACCOUNTS_COLUMNS.didMatchmaking] = new Date()
      return insertRecord(newAccount)
    }
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error({ err })
    return null
  }
}

async function insertRecord(data: Account) {
  await accounts()
    .insert(data)
    .timeout(DB_TIMEOUT)
  return true
}
