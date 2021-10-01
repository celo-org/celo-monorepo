import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Counters, Histograms, Labels } from '../../common/metrics'
import { getDatabase } from '../database'
import { DOMAINS_STATES_COLUMNS, DOMAINS_STATES_TABLE, DomainState } from '../models/domainState'

function domainsStates() {
  return getDatabase()<DomainState>(DOMAINS_STATES_TABLE)
}

export async function setDomainDisabled(domain: string, logger: Logger): Promise<void> {
  const disableDomainMeter = Histograms.dbOpsInstrumentation.labels('disableDomain').startTimer()
  logger.debug({ domain }, 'Disabling domain')
  try {
    await domainsStates()
      .where(DOMAINS_STATES_COLUMNS.domain, domain)
      .update(DOMAINS_STATES_COLUMNS.disabled, true)
      .timeout(DB_TIMEOUT)
    disableDomainMeter()
  } catch (err) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error(err)
    disableDomainMeter()
    throw err
  } finally {
    disableDomainMeter()
  }
}

export async function getDomainState(domain: string, logger: Logger): Promise<DomainState | null> {
  const getDomainStateMeter = Histograms.dbOpsInstrumentation.labels('getDomainState').startTimer()
  logger.debug({ domain }, 'Getting domain state from db')
  try {
    const result = await domainsStates()
      .where(DOMAINS_STATES_COLUMNS.domain, domain)
      .first()
      .timeout(DB_TIMEOUT)
    getDomainStateMeter()
    return result ?? null
  } catch (err) {
    Counters.databaseErrors.labels(Labels.read).inc()
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    getDomainStateMeter()
    throw err
  } finally {
    getDomainStateMeter()
  }
}

export async function updateDomainState(
  domain: string,
  counter: number,
  timer: number,
  logger: Logger
): Promise<void> {
  const updateDomainStateMeter = Histograms.dbOpsInstrumentation
    .labels('updateDomainState')
    .startTimer()
  logger.debug({ domain, timer, counter }, 'Update Domain State')
  try {
    const result = await domainsStates()
      .where(DOMAINS_STATES_COLUMNS.domain, domain)
      .first()
      .timeout(DB_TIMEOUT)

    if (!result) {
      await insertRecord(new DomainState(domain, counter, timer))
    } else {
      await domainsStates()
        .where(DOMAINS_STATES_COLUMNS.domain, domain)
        .update({ timer, counter })
        .timeout(DB_TIMEOUT)
    }
    updateDomainStateMeter()
  } catch (err) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error(err)
    updateDomainStateMeter()
    throw err
  } finally {
    updateDomainStateMeter()
  }
}

async function insertRecord(data: DomainState) {
  return getDatabase().insert(data).timeout(DB_TIMEOUT)
}
