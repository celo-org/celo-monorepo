import { getDatabase, setSerializable } from '../database'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

const knex = getDatabase()
/*
 * Returns how many queries the account has already performed.
 */
export async function getPerformedQueryCount(account: string): Promise<number> {
  return knex(ACCOUNTS_TABLE)
    .where(ACCOUNTS_COLUMNS.address, account)
    .select(ACCOUNTS_COLUMNS.numLookups)
    .first()
    .then((object) => {
      return object === undefined ? 0 : object[ACCOUNTS_COLUMNS.numLookups]
    })
}

/*
 * Increments query count in database.
 */
export async function incrementQueryCount(account: string) {
  const data = {
    [ACCOUNTS_COLUMNS.address]: account,
    [ACCOUNTS_COLUMNS.createdAt]: new Date(),
    [ACCOUNTS_COLUMNS.numLookups]: 1,
  }
  await setSerializable()
  return (
    (await knex(ACCOUNTS_TABLE)
      .where(ACCOUNTS_COLUMNS.address, account)
      .increment(ACCOUNTS_COLUMNS.numLookups, 1)
      .catch((error) => console.error(error))) ||
    // tslint:disable-next-line: no-return-await
    (await knex(ACCOUNTS_TABLE)
      .insert(data)
      .timeout(10000)
      .then(() => console.log('successful insertion')))
  )
}
