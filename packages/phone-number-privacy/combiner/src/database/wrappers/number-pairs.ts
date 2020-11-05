import { ErrorMessage, logger } from '@celo/phone-number-privacy-common'
import { getDatabase } from '../database'
import { NUMBER_PAIRS_COLUMN, NUMBER_PAIRS_TABLE, NumberPair } from '../models/numberPair'

function numberPairs() {
  return getDatabase()<NumberPair>(NUMBER_PAIRS_TABLE)
}

/*
 * Returns contacts who have already matched with the user (a contact-->user mapping exists).
 */
export async function getNumberPairContacts(
  userPhone: string,
  contactPhones: string[]
): Promise<string[]> {
  try {
    const contentPairs = await numberPairs()
      .select(NUMBER_PAIRS_COLUMN.userPhoneHash)
      .where(NUMBER_PAIRS_COLUMN.contactPhoneHash, userPhone)

    const contactPhonesSet = new Set(contactPhones)
    return contentPairs
      .map((contactPair) => contactPair[NUMBER_PAIRS_COLUMN.userPhoneHash])
      .filter((number) => contactPhonesSet.has(number))
  } catch (err) {
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error({ err })
    return []
  }
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
    const data = new NumberPair(userPhone, contactPhone)
    rows.push(data)
  }
  try {
    await getDatabase().batchInsert(NUMBER_PAIRS_TABLE, rows)
  } catch (err) {
    // ignore duplicate insertion error (23505)
    if (err.code !== '23505') {
      logger.error(ErrorMessage.DATABASE_INSERT_FAILURE)
      logger.error({ err })
    }
  }
}
