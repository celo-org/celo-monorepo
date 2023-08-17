import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { Account, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

function accounts(db: Knex) {
  return db<Account>(ACCOUNTS_TABLE)
}

/*
 * Get DEK signer record from DB.
 */
export async function getDekSignerRecord(
  db: Knex,
  account: string,
  logger: Logger
): Promise<string | undefined> {
  try {
    logger.info('getting Dek Signer Record')
    const dekSignerRecord = await accounts(db)
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

export async function updateDekSignerRecord(
  db: Knex,
  account: string,
  newDek: string,
  logger: Logger,
  trx: Knex.Transaction
) {
  logger.info(`updating Dek Signer Record`)
  if (await getAccountExist(db, account, trx)) {
    await accounts(db)
      .transacting(trx)
      .timeout(DB_TIMEOUT)
      .where(ACCOUNTS_COLUMNS.address, account)
      .update({ [ACCOUNTS_COLUMNS.dek]: newDek })
    await accounts(db)
      .transacting(trx)
      .timeout(DB_TIMEOUT)
      .where(ACCOUNTS_COLUMNS.address, account)
      .update({ [ACCOUNTS_COLUMNS.onChainDataLastUpdated]: new Date() })
  } else {
    // account does not exists
    const newAccount = new Account(account, newDek)
    await accounts(db).transacting(trx).timeout(DB_TIMEOUT).insert(newAccount)
  }
}

export function tableWithLockForTrx(baseQuery: Knex.QueryBuilder, trx?: Knex.Transaction) {
  if (trx) {
    // Lock relevant database rows for the duration of the transaction
    return baseQuery.transacting(trx).forUpdate()
  }
  return baseQuery
}

async function getAccountExist(
  db: Knex,
  account: string,
  trx?: Knex.Transaction
): Promise<boolean> {
  const accountRecord = await tableWithLockForTrx(accounts(db), trx)
    .where(ACCOUNTS_COLUMNS.address, account)
    .first()
    .timeout(DB_TIMEOUT)

  return !!accountRecord
}
