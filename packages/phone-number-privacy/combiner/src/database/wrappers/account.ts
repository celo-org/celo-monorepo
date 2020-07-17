import { ErrorMessage } from '@celo/phone-number-privacy-common'
import { DB_TIMEOUT } from '../../common/constants'
import logger from '../../common/logger'
import { getDatabase } from '../database'
import { Account, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

function accounts() {
  return getDatabase()<Account>(ACCOUNTS_TABLE)
}

async function getAccountExists(account: string): Promise<boolean> {
  const existingAccountRecord = await accounts()
    .where(ACCOUNTS_COLUMNS.address, account)
    .first()
  return !!existingAccountRecord
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
  } catch (e) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE, e)
    return false
  }
}

/*
 * Set did matchmaking to true in database.  If record doesn't exist, create one.
 */
export async function setDidMatchmaking(account: string) {
  logger.debug('Setting did matchmaking')
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
  } catch (e) {
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE, e)
    return null
  }
}

async function insertRecord(data: Account) {
  await accounts()
    .insert(data)
    .timeout(DB_TIMEOUT)
  return true
}
