import { ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { OdisError } from '../error'
import { Counters, Histograms, Labels, newMeter } from '../metrics'

export type DatabaseErrorMessage =
  | ErrorMessage.DATABASE_GET_FAILURE
  | ErrorMessage.DATABASE_INSERT_FAILURE
  | ErrorMessage.DATABASE_UPDATE_FAILURE
  | ErrorMessage.DATABASE_REMOVE_FAILURE

export function countAndThrowDBError(
  err: any,
  logger: Logger,
  errorMsg: DatabaseErrorMessage
): never {
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
    case ErrorMessage.DATABASE_REMOVE_FAILURE:
      label = Labels.BATCH_DELETE
      break
    default:
      throw new Error('Unknown database label provided')
  }

  Counters.databaseErrors.labels(label).inc()
  logger.error({ err }, errorMsg)
  throw new OdisError(errorMsg)
}

export function doMeteredSql<A>(
  sqlLabel: string,
  errorMsg: DatabaseErrorMessage,
  logger: Logger,
  fn: () => Promise<A>
): Promise<A> {
  const meter = newMeter(Histograms.dbOpsInstrumentation, sqlLabel)

  return meter(async () => {
    const res = await fn()
    return res
  }).catch((err) => countAndThrowDBError(err, logger, errorMsg))
}
