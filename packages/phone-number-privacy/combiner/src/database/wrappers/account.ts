import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { getDatabase, getTransaction } from '../database'
import { Account, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

function accounts() {
  return getDatabase()<Account>(ACCOUNTS_TABLE)
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
  const trx = await getTransaction()
  const accountsTrx = () =>
    accounts().transacting(trx).timeout(DB_TIMEOUT).where(ACCOUNTS_COLUMNS.address, account)
  return accountsTrx()
    .then(async (res) => {
      if (res.length) {
        // If account exists in db
        await accountsTrx()
          .update(ACCOUNTS_COLUMNS.didMatchmaking, new Date())
          .then(async () => {
            if (signedUserPhoneNumber) {
              await accountsTrx()
                .having(ACCOUNTS_COLUMNS.didMatchmaking, 'is', null)
                .update(ACCOUNTS_COLUMNS.signedUserPhoneNumber, signedUserPhoneNumber)
            }
          })
      } else {
        const newAccount = new Account(account, signedUserPhoneNumber)
        newAccount[ACCOUNTS_COLUMNS.didMatchmaking] = new Date()
        await accounts().transacting(trx).timeout(DB_TIMEOUT).insert(newAccount)
      }
      trx.commit()
      return true
    })
    .catch((err) => {
      logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
      logger.error(err)
      trx.rollback()
      return null
    })
}
