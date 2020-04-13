import { getDatabase } from '../database'
import { NUMBER_PAIRS_COLUMN, NUMBER_PAIRS_TABLE } from '../models/numberPair'

const knex = getDatabase()

/*
 * Returns contacts who have already matched with the user (a contact-->user mapping exists).
 */
export async function getNumberPairContacts(
  userPhone: string,
  contactPhones: string[]
): Promise<string[]> {
  return knex(NUMBER_PAIRS_TABLE)
    .select(NUMBER_PAIRS_COLUMN.userPhoneHash)
    .where(NUMBER_PAIRS_COLUMN.contactPhoneHash, userPhone)
    .then((contactPairs) =>
      contactPairs
        .map((contractPair) => contractPair[NUMBER_PAIRS_COLUMN.userPhoneHash])
        .filter((number) => contactPhones.includes(number))
    )
}

/*
 * Add record for user-->contact mapping,
 */
export async function setNumberPairContacts(
  userPhone: string,
  contactPhones: string[]
): Promise<void> {
  const rows: any = []
  for (const contactPhone of contactPhones) {
    const data = {
      [NUMBER_PAIRS_COLUMN.userPhoneHash]: userPhone,
      [NUMBER_PAIRS_COLUMN.contactPhoneHash]: contactPhone,
    }
    rows.push(data)
  }

  return knex
    .batchInsert(NUMBER_PAIRS_TABLE, rows)
    .then(() => console.log('successful batch insertion'))
    .catch((e) => {
      if (e.code !== '23505') {
        // ignore duplicate insertion error (23505)
        console.error('error batch inserting number-paid', e)
      }
    }) // TODO (amyslawson) handle error
}
