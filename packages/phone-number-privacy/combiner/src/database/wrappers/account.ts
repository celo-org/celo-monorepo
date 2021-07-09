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

export async function getAccountSignedUserPhoneNumberRecord(
  account: string,
  logger: Logger
): Promise<string | undefined> {
  try {
    const signedUserPhoneNumberRecord = await accounts()
      .where(ACCOUNTS_COLUMNS.address, account)
      .select(ACCOUNTS_COLUMNS.signedUserPhoneNumber)
      .first()
      .timeout(DB_TIMEOUT)
    return signedUserPhoneNumberRecord
      ? signedUserPhoneNumberRecord[ACCOUNTS_COLUMNS.signedUserPhoneNumber]
      : ''
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    return undefined
  }
}

export async function setAccountSignedUserPhoneNumberRecord(
  account: string,
  signedUserPhoneNumber: string,
  logger: Logger
) {
  try {
    return accounts()
      .where(ACCOUNTS_COLUMNS.address, account)
      .update(ACCOUNTS_COLUMNS.signedUserPhoneNumber, signedUserPhoneNumber)
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
  logger: Logger,
  signedUserPhoneNumber?: string
) {
  logger.debug({ account }, 'Setting did matchmaking')
  if (await getAccountExists(account, logger)) {
    try {
      const query = accounts()
        .timeout(DB_TIMEOUT)
        .where(ACCOUNTS_COLUMNS.address, account)
        .update(ACCOUNTS_COLUMNS.didMatchmaking, new Date())
      return signedUserPhoneNumber
        ? query.update(ACCOUNTS_COLUMNS.signedUserPhoneNumber, signedUserPhoneNumber)
        : query
    } catch (err) {
      logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
      logger.error(err)
      return null
    }
  } else {
    const newAccount = new Account(account, signedUserPhoneNumber)
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
