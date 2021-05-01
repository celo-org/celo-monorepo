import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { getDatabase } from '../database'
import { Account, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

function accounts() {
  return getDatabase()<Account>(ACCOUNTS_TABLE)
}

async function getAccountExists(account: string, logger: Logger): Promise<boolean> {
  try {
    const existingAccountRecord = await accounts()
      .where(ACCOUNTS_COLUMNS.address, account)
      .first()
      .timeout(DB_TIMEOUT)
    return !!existingAccountRecord
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    return false
  }
}

export async function getAccountIdentifier(account: string, logger: Logger): Promise<string> {
  try {
    const existingAccountIdentifierRecord = await accounts()
      .where(ACCOUNTS_COLUMNS.address, account)
      .select(ACCOUNTS_COLUMNS.hashedPhoneNumber)
      .first()
      .timeout(DB_TIMEOUT)
    return existingAccountIdentifierRecord
      ? existingAccountIdentifierRecord[ACCOUNTS_COLUMNS.hashedPhoneNumber]
      : 'empty'
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    return 'error'
  }
}

export async function setAccountIdentifier(
  account: string,
  hashedPhoneNumber: string,
  logger: Logger
) {
  try {
    return accounts()
      .where(ACCOUNTS_COLUMNS.address, account)
      .update(ACCOUNTS_COLUMNS.hashedPhoneNumber, hashedPhoneNumber)
      .timeout(DB_TIMEOUT)
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error(err)
    return null
  }
}

/*
 * Returns whether account has already performed matchmaking
 */
export async function getDidMatchmaking(account: string, logger: Logger): Promise<boolean> {
  try {
    const didMatchmaking = await accounts()
      .where(ACCOUNTS_COLUMNS.address, account)
      .select(ACCOUNTS_COLUMNS.didMatchmaking)
      .first()
      .timeout(DB_TIMEOUT)
    if (!didMatchmaking) {
      return false
    }
    return !!didMatchmaking[ACCOUNTS_COLUMNS.didMatchmaking]
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    return false
  }
}

/*
 * Set did matchmaking to true in database.  If record doesn't exist, create one.
 */
export async function setDidMatchmaking(
  account: string,
  hashedPhoneNumber: string,
  logger: Logger
) {
  logger.debug({ account }, 'Setting did matchmaking')
  if (await getAccountExists(account, logger)) {
    try {
      return accounts()
        .where(ACCOUNTS_COLUMNS.address, account)
        .update(ACCOUNTS_COLUMNS.didMatchmaking, new Date())
        .timeout(DB_TIMEOUT)
    } catch (err) {
      logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
      logger.error(err)
      return null
    }
  } else {
    const newAccount = new Account(account, hashedPhoneNumber)
    newAccount[ACCOUNTS_COLUMNS.didMatchmaking] = new Date()
    return insertRecord(newAccount, logger)
  }
}

async function insertRecord(data: Account, logger: Logger) {
  try {
    await accounts().insert(data).timeout(DB_TIMEOUT)
    return true
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error(err)
    return null
  }
}
