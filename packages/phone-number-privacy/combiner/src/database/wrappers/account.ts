import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { getDatabase, getTransaction } from '../database'
import { Account, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

function accounts() {
  return getDatabase()<Account>(ACCOUNTS_TABLE)
}

/*
 * Get DEK signer record from DB.
 */
export async function getDekSignerRecord(
  account: string,
  logger: Logger
): Promise<string | undefined> {
  try {
    const dekSignerRecord = await accounts()
      .where(ACCOUNTS_COLUMNS.address, account)
      .select(ACCOUNTS_COLUMNS.dek)
      .first()
      .timeout(DB_TIMEOUT)
    return dekSignerRecord ? dekSignerRecord[ACCOUNTS_COLUMNS.dek] : undefined
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    return undefined
  }
}

export async function updateDekSignerRecord(account: string, newDek: string, logger: Logger) {
  const trx = await getTransaction()
  const accountTxBase = () =>
    accounts().transacting(trx).timeout(DB_TIMEOUT).where(ACCOUNTS_COLUMNS.address, account)

  accountTxBase()
    .then(async (res) => {
      if (res.length) {
        // if account exist
        await accountTxBase().update({ [ACCOUNTS_COLUMNS.dek]: newDek })
        await accountTxBase().update({ [ACCOUNTS_COLUMNS.onChainDataLastUpdated]: new Date() })
      } else {
        // account does not exits
        const newAccount = new Account(account, newDek)
        await accounts().transacting(trx).timeout(DB_TIMEOUT).insert(newAccount)
      }
      trx.commit()
    })
    .catch((err) => {
      logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
      logger.error(err)
      trx.rollback()
    })
}
