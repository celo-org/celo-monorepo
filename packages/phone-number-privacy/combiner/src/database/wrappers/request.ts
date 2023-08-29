import Logger from 'bunyan'
import { Knex } from 'knex'
import config from '../../config'
import { tableWithLockForTrx } from '../../utils/utils'
import {
  PnpSignRequestRecord,
  REQUESTS_COLUMNS,
  REQUESTS_TABLE,
  toPnpSignRequestRecord,
} from '../models/request'

function requests(db: Knex) {
  return db<PnpSignRequestRecord>(REQUESTS_TABLE)
}

// TODO (soloseng): should return the response associated to this request.
export async function getCombinedSignatureIfRequestExists(
  db: Knex,
  account: string,
  blindedQuery: string,
  // logger: Logger,
  trx?: Knex.Transaction
): Promise<string | null> {
  // logger.debug(`Checking if request exists for account: ${account}, blindedQuery: ${blindedQuery}`)
  const existingRequest = await tableWithLockForTrx(requests(db), trx)
    .where({
      [REQUESTS_COLUMNS.address]: account,
      [REQUESTS_COLUMNS.blindedQuery]: blindedQuery,
    })
    .first()
    .timeout(config.db.timeout)

  if (existingRequest) {
    return existingRequest[REQUESTS_COLUMNS.combinedSignature]
  }
  return null
}

export async function storeRequest(
  db: Knex,
  account: string,
  blindedQuery: string,
  combinedSignature: string,
  logger?: Logger, //revert the `?`
  trx?: Knex.Transaction //revert the `?`
): Promise<void> {
  logger!.debug(
    `Storing salt request for: ${account}, blindedQuery: ${blindedQuery} with combinedSignature: ${combinedSignature}`
  )
  await requests(db)
    .transacting(trx!)
    .insert(toPnpSignRequestRecord(account, blindedQuery, combinedSignature))
    .timeout(config.db.timeout)
}
