import { ErrorMessages } from '../../common/error-utils'
import { getDatabase } from '../database'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

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
 * Increments query count in database.
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
  const data = {
    [ACCOUNTS_COLUMNS.address]: account,
    [ACCOUNTS_COLUMNS.createdAt]: new Date(),
    [ACCOUNTS_COLUMNS.numLookups]: 1,
  }
  try {
    await getDatabase()(ACCOUNTS_TABLE)
      .insert(data)
      .timeout(10000)
  } catch (e) {
    console.error(ErrorMessages.DATABASE_INSERT_FAILURE, e)
  }
  return true
}
