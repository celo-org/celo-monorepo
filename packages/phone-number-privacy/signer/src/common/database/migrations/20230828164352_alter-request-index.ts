import { Knex } from 'knex'
import { REQUESTS_COLUMNS, REQUESTS_TABLE } from '../models/request'

export async function up(knex: Knex): Promise<void> {
  // Delete repeated rows (caller_address, blinded_query) with different timestamps
  await knex.raw(deleteDuplicatedRequestsQueryStr())
  return knex.schema.alterTable(REQUESTS_TABLE, (t) => {
    // Removes primary index
    t.dropPrimary()
    // Sets the primary index as the pair (address, blindedQuery)
    t.primary([REQUESTS_COLUMNS.address, REQUESTS_COLUMNS.blindedQuery])
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable(REQUESTS_TABLE, (t) => {
    t.dropPrimary()
    t.primary([REQUESTS_COLUMNS.address, REQUESTS_COLUMNS.blindedQuery, REQUESTS_COLUMNS.timestamp])
  })
}

function deleteDuplicatedRequestsQueryStr() {
  return 'DELETE Req FROM requestsOnChain Req INNER JOIN ( \
  SELECT *, RANK() OVER(PARTITION BY caller_address, blinded_query ORDER BY timestamp) rank \
    FROM requestsOnChain \
  ) Ranked ON Req.caller_address = Ranked.caller_address AND \
      Req.blinded_query = Ranked.blinded_query AND \
      Req.timestamp = Ranked.timestamp \
    WHERE rank > 1'
}
