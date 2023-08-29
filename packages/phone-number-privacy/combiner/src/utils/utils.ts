import { Knex } from 'knex'

export function tableWithLockForTrx(baseQuery: Knex.QueryBuilder, trx?: Knex.Transaction) {
  if (trx) {
    // Lock relevant database rows for the duration of the transaction
    return baseQuery.transacting(trx).forUpdate()
  }
  return baseQuery
}
