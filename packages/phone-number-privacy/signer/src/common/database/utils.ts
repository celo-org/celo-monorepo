import { ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { Counters, Labels } from '../metrics'

export type DatabaseErrorMessage =
  | ErrorMessage.DATABASE_GET_FAILURE
  | ErrorMessage.DATABASE_INSERT_FAILURE
  | ErrorMessage.DATABASE_UPDATE_FAILURE

export function countAndThrowDBError<T>(
  err: any,
  logger: Logger,
  errorMsg: DatabaseErrorMessage
): T {
  let label: Labels
  switch (errorMsg) {
    case ErrorMessage.DATABASE_UPDATE_FAILURE:
      label = Labels.UPDATE
      break
    case ErrorMessage.DATABASE_GET_FAILURE:
      label = Labels.READ
      break
    case ErrorMessage.DATABASE_INSERT_FAILURE:
      label = Labels.INSERT
      break
    default:
      throw new Error('Unknown database label provided')
  }

  Counters.databaseErrors.labels(label).inc()
  logger.error({ err }, errorMsg)
  throw new Error(errorMsg)
}

export function queryWithOptionalTrx(baseQuery: Knex.QueryBuilder, trx?: Knex.Transaction) {
  if (trx) {
    return baseQuery.transacting(trx)
  }
  return baseQuery
}
