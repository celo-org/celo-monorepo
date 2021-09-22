import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Counters, Histograms, Labels } from '../../common/metrics'
import { getDatabase } from '../database'
import { Domain, DOMAINS_COLUMNS, DOMAINS_TABLE } from '../models/domain'

function domains() {
  return getDatabase()<Domain>(DOMAINS_TABLE)
}

const emptyDomain: Domain = {
  [DOMAINS_COLUMNS.counter]: 0,
  [DOMAINS_COLUMNS.disabled]: false,
  [DOMAINS_COLUMNS.domain]: '',
  [DOMAINS_COLUMNS.timer]: 0,
}

export async function setDomainDisabled(
  domain: string,
  value: boolean,
  logger: Logger
): Promise<boolean> {
  const disableDomainMeter = Histograms.dbOpsInstrumentation.labels('disableDomain').startTimer()
  logger.debug({ domain, value }, 'Disabling domain')
  try {
    await domains().where(DOMAINS_COLUMNS.domain, domain).update(DOMAINS_COLUMNS.disabled, value)
    disableDomainMeter()
    return true
  } catch (err) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error(err)
    disableDomainMeter()
    return false
  }
}

export async function getDomain(domain: string, logger: Logger): Promise<Domain | null> {
  const getDomainMeter = Histograms.dbOpsInstrumentation.labels('getDomain').startTimer()
  logger.debug({ domain }, 'Get Domain')
  try {
    const result = await domains().where(DOMAINS_COLUMNS.domain, domain).first().timeout(DB_TIMEOUT)
    getDomainMeter()
    return result ?? { ...emptyDomain }
  } catch (err) {
    Counters.databaseErrors.labels(Labels.read).inc()
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    getDomainMeter()
    throw err
  }
}

export async function updateDomain(
  domain: string,
  counter: number,
  timer: number,
  logger: Logger
): Promise<void> {
  const updateDomainMeter = Histograms.dbOpsInstrumentation.labels('updateDomain').startTimer()
  logger.debug({ domain, timer, counter }, 'Update Domain')
  try {
    const result = await domains().where(DOMAINS_COLUMNS.domain, domain).first().timeout(DB_TIMEOUT)

    if (result == null) {
      await insertRecord(new Domain(domain, counter, timer, false))
    } else {
      await domains()
        .where(DOMAINS_COLUMNS.domain, domain)
        .update({ timer, counter })
        .timeout(DB_TIMEOUT)
    }
    updateDomainMeter()
  } catch (err) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error(err)
    updateDomainMeter()
    throw err
  }
}

async function insertRecord(data: Domain) {
  return getDatabase().insert(data).timeout(DB_TIMEOUT)
}
