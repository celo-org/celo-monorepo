import { ErrorMessages } from '../../common/error-utils'
import { getDatabase } from '../database'
import { Account, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

/*
 * Returns how many queries the account has already performed.
 */
export async function getPerformedQueryCount(account: string): Promise<number> {
  try {
    const queryCounts = await getDatabase()(ACCOUNTS_TABLE)
      .where(ACCOUNTS_COLUMNS.address, account)
      .select(ACCOUNTS_COLUMNS.numLookups)
      .first()
    return queryCounts === undefined ? 0 : queryCounts[ACCOUNTS_COLUMNS.numLookups]
  } catch (e) {
    console.error(ErrorMessages.DATABASE_GET_FAILURE, e)
    return 0
  }
}

/*
 * Returns whether account has already performed matchmaking
 */
export async function getDidMatchmaking(account: string): Promise<boolean> {
  try {
    const didMatchmaking = await getDatabase()(ACCOUNTS_TABLE)
      .where(ACCOUNTS_COLUMNS.address, account)
      .select(ACCOUNTS_COLUMNS.didMatchmaking)
      .first()
    return didMatchmaking !== undefined && didMatchmaking[ACCOUNTS_COLUMNS.didMatchmaking] !== null
  } catch (e) {
    console.error(ErrorMessages.DATABASE_GET_FAILURE, e)
    return false
  }
}

/*
 * Increments query count in database.  If record doesn't exist, create one.
 */
export async function incrementQueryCount(account: string): Promise<void | number> {
  await ((await incrementExistingQueryCount(account)) || (await addNewQueryCount(account)))
}

async function incrementExistingQueryCount(account: string) {
  try {
    return await getDatabase()(ACCOUNTS_TABLE)
      .where(ACCOUNTS_COLUMNS.address, account)
      .increment(ACCOUNTS_COLUMNS.numLookups, 1)
  } catch (e) {
    console.error(ErrorMessages.DATABASE_UPDATE_FAILURE, e)
    return true
  }
}

async function addNewQueryCount(account: string) {
  const data = new Account(account)
  data[ACCOUNTS_COLUMNS.numLookups] = 1
  return updateRecord(data)
}

/*
 * Set did matchmaking to true in database.  If record doesn't exist, create one.
 */
export async function setDidMatchmaking(account: string) {
  await ((await setExistingDidMatchmaking(account)) || (await addNewRecordWithMatchmaking(account)))
}

async function setExistingDidMatchmaking(account: string) {
  try {
    return await getDatabase()(ACCOUNTS_TABLE)
      .where(ACCOUNTS_COLUMNS.address, account)
      .update(ACCOUNTS_COLUMNS.didMatchmaking, new Date())
  } catch (e) {
    console.error(ErrorMessages.DATABASE_UPDATE_FAILURE, e)
    return true
  }
}

async function addNewRecordWithMatchmaking(account: string) {
  const data = new Account(account)
  data[ACCOUNTS_COLUMNS.didMatchmaking] = new Date()
  return updateRecord(data)
}

async function updateRecord(data: Account) {
  try {
    await getDatabase()(ACCOUNTS_TABLE)
      .insert(data)
      .timeout(10000)
  } catch (e) {
    console.error(ErrorMessages.DATABASE_INSERT_FAILURE, e)
  }
  return true
}
