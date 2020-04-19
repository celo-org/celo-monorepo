import { getDatabase } from '../database'
import { NUMBER_PAIRS_COLUMN, NUMBER_PAIRS_TABLE } from '../models/numberPair'

/*
 * Returns contacts who have already matched with the user (a contact-->user mapping exists).
 */
export async function getNumberPairContacts(
  userPhone: string,
  contactPhones: string[]
): Promise<string[]> {
  const contentPairs = await getDatabase()(NUMBER_PAIRS_TABLE)
    .select(NUMBER_PAIRS_COLUMN.userPhoneHash)
    .where(NUMBER_PAIRS_COLUMN.contactPhoneHash, userPhone)

  return contentPairs
    .map((contractPair) => contractPair[NUMBER_PAIRS_COLUMN.userPhoneHash])
    .filter((number) => contactPhones.includes(number))
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
  try {
    await getDatabase().batchInsert(NUMBER_PAIRS_TABLE, rows)
  } catch (e) {
    // TODO (amyslawson) handle error
    if (e.code !== '23505') {
      // ignore duplicate insertion error (23505)
      console.error('error batch inserting number-paid', e)
    }
  }
}
