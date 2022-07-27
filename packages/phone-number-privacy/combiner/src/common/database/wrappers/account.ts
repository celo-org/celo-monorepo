import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { VerifiedPhoneNumberDekSignature } from '../../../legacy/endpoints/match-making/get-contact-matches'
import { getTransaction } from '../database'
import { Account, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

function accounts(db: Knex) {
  return db<Account>(ACCOUNTS_TABLE)
}

export async function getAccountSignedUserPhoneNumberRecord(
  db: Knex,
  account: string,
  logger: Logger
): Promise<string | undefined> {
  try {
    const signedUserPhoneNumberRecord = await accounts(db)
      .where(ACCOUNTS_COLUMNS.address, account)
      .select(ACCOUNTS_COLUMNS.signedUserPhoneNumber)
      .first()
      .timeout(DB_TIMEOUT)
    return signedUserPhoneNumberRecord
      ? signedUserPhoneNumberRecord[ACCOUNTS_COLUMNS.signedUserPhoneNumber]
      : undefined
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    throw err
  }
}

export async function getDekSignerRecord(
  db: Knex,
  account: string,
  logger: Logger
): Promise<string | undefined> {
  try {
    const dekSignerRecord = await accounts(db)
      .where(ACCOUNTS_COLUMNS.address, account)
      .select(ACCOUNTS_COLUMNS.dekSigner)
      .first()
      .timeout(DB_TIMEOUT)
    return dekSignerRecord ? dekSignerRecord[ACCOUNTS_COLUMNS.dekSigner] : undefined
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    return undefined
  }
}

/*
 * Returns whether account has already performed matchmaking
 */
export async function getDidMatchmaking(
  db: Knex,
  account: string,
  logger: Logger
): Promise<boolean> {
  try {
    const didMatchmaking = await accounts(db)
      .where(ACCOUNTS_COLUMNS.address, account)
      .select(ACCOUNTS_COLUMNS.didMatchmaking)
      .first()
      .timeout(DB_TIMEOUT)
    return !!didMatchmaking && !!didMatchmaking[ACCOUNTS_COLUMNS.didMatchmaking]
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    throw err
  }
}

/*
 * Set did matchmaking to true in database.  If record doesn't exist, create one.
 */
export async function setDidMatchmaking(
  db: Knex,
  account: string,
  logger: Logger,
  verifiedPhoneNumberDekSig?: VerifiedPhoneNumberDekSignature
) {
  logger.debug({ account }, 'Setting did matchmaking')
  const trx = await getTransaction(db)
  const accountTrxBase = () =>
    accounts(db).transacting(trx).timeout(DB_TIMEOUT).where(ACCOUNTS_COLUMNS.address, account)
  return accountTrxBase()
    .then(async (res) => {
      if (res.length) {
        // If account exists in db
        await accountTrxBase()
          .update(ACCOUNTS_COLUMNS.didMatchmaking, new Date())
          .then(async () => {
            if (verifiedPhoneNumberDekSig) {
              await accountTrxBase()
                .having(ACCOUNTS_COLUMNS.signedUserPhoneNumber, 'is', null) // prevents overwriting
                .update(
                  ACCOUNTS_COLUMNS.signedUserPhoneNumber,
                  verifiedPhoneNumberDekSig.signedUserPhoneNumber
                )
              await accountTrxBase()
                .having(ACCOUNTS_COLUMNS.dekSigner, 'is', null)
                .update(ACCOUNTS_COLUMNS.dekSigner, verifiedPhoneNumberDekSig.dekSigner)
            }
          })
      } else {
        const newAccount = new Account(account, verifiedPhoneNumberDekSig)
        newAccount[ACCOUNTS_COLUMNS.didMatchmaking] = new Date()
        await accounts(db).transacting(trx).timeout(DB_TIMEOUT).insert(newAccount)
      }
      trx.commit()
    })
    .catch((err) => {
      logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
      logger.error(err)
      trx.rollback()
    })
}
