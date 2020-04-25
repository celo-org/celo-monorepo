import { ErrorMessages } from '../../common/error-utils'
import { getDatabase } from '../database'
import { Account, ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

function accounts() {
  return getDatabase()<Account>(ACCOUNTS_TABLE)
}

/*
 * Returns how many queries the account has already performed.
 */
export async function getPerformedQueryCount(account: string): Promise<number> {
  try {
    const queryCounts = await accounts()
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
 * Increments query count in database.  If record doesn't exist, create one.
 */
export async function incrementQueryCount(account: string): Promise<void | number> {
  await ((await incrementExistingQueryCount(account)) || (await addNewQueryCount(account)))
}

async function incrementExistingQueryCount(account: string) {
  try {
    return await accounts()
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
    console.error(ErrorMessages.DATABASE_GET_FAILURE, e)
    return false
  }
}

/*
 * Set did matchmaking to true in database.  If record doesn't exist, create one.
 */
export async function setDidMatchmaking(account: string) {
  try {
    const existingAccountRecord = await accounts()
      .where(ACCOUNTS_COLUMNS.address, account)
      .first()

    if (existingAccountRecord) {
      return accounts()
        .where(ACCOUNTS_COLUMNS.address, account)
        .update(ACCOUNTS_COLUMNS.didMatchmaking, new Date())
    } else {
      const newAccount = new Account(account)
      newAccount[ACCOUNTS_COLUMNS.didMatchmaking] = new Date()
      return updateRecord(newAccount)
    }
  } catch (e) {
    console.error(ErrorMessages.DATABASE_UPDATE_FAILURE, e)
    return true
  }
}

async function updateRecord(data: Account) {
  try {
    await accounts()
      .insert(data)
      .timeout(10000)
  } catch (e) {
    console.error(ErrorMessages.DATABASE_INSERT_FAILURE, e)
  }
  return true
}
