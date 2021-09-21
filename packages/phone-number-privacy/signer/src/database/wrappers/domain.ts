import { ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Counters, Histograms, Labels } from '../../common/metrics'
import { getDatabase } from '../database'
import { Domain, DOMAINS_COLUMNS, DOMAINS_TABLE } from '../models/domain'

function domains() {
  return getDatabase()<Domain>(DOMAINS_TABLE)
}

export async function setDomainDisabled(
  domain: string,
  value: boolean,
  logger: Logger
): Promise<boolean> {
  const storeRequestMeter = Histograms.dbOpsInstrumentation.labels('disableDomain').startTimer()
  logger.debug({ domain, value }, 'Disabling domain')
  try {
    await domains().where(DOMAINS_COLUMNS.domain, domain).update(DOMAINS_COLUMNS.disabled, value)
    storeRequestMeter()
    return true
  } catch (err) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error(err)
    storeRequestMeter()
    return false
  }
}
