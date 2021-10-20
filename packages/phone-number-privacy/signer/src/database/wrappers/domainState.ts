import { domainHash, KnownDomain } from '@celo/identity/lib/odis/domains'
import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Counters, Histograms, Labels } from '../../common/metrics'
import { getDatabase } from '../database'
import { DOMAINS_STATES_COLUMNS, DOMAINS_STATES_TABLE, DomainState } from '../models/domainState'
import { Transaction } from 'knex'

function domainsStates() {
  return getDatabase()<DomainState>(DOMAINS_STATES_TABLE)
}

export function domainsStatesTransaction() {
  return getDatabase().transaction()
}

export async function setDomainDisabled(domain: KnownDomain, logger: Logger): Promise<void> {
  const disableDomainMeter = Histograms.dbOpsInstrumentation.labels('disableDomain').startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug('Disabling domain', { domain, hash })
  try {
    await domainsStates()
      .where(DOMAINS_STATES_COLUMNS.domainHash, hash)
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

export async function getDomainState(
  domain: KnownDomain,
  logger: Logger
): Promise<DomainState | null> {
  const getDomainStateMeter = Histograms.dbOpsInstrumentation.labels('getDomainState').startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug('Getting domain state from db', { domain, hash })
  try {
    const result = await domainsStates()
      .where(DOMAINS_STATES_COLUMNS.domainHash, hash)
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

export async function getDomainStateWithLock(
  domain: KnownDomain,
  trx: Transaction<DomainState>,
  logger: Logger
): Promise<DomainState | null> {
  const getDomainStateWithLockMeter = Histograms.dbOpsInstrumentation
    .labels('getDomainStateWithLock')
    .startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug('Getting domain state from db with lock', { domain, hash })
  try {
    const result = await domainsStates()
      .transacting(trx)
      .forUpdate()
      .where(DOMAINS_STATES_COLUMNS.domainHash, hash)
      .first()
      .timeout(DB_TIMEOUT)
    getDomainStateWithLockMeter()
    return result ?? null
  } catch (err) {
    Counters.databaseErrors.labels(Labels.read).inc()
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    getDomainStateWithLockMeter()
    throw err
  } finally {
    getDomainStateWithLockMeter()
  }
}

export async function updateDomainState(
  domain: KnownDomain,
  trx: Transaction<DomainState>,
  counter: number,
  timer: number,
  logger: Logger
): Promise<void> {
  const updateDomainStateMeter = Histograms.dbOpsInstrumentation
    .labels('updateDomainState')
    .startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug('Update domain state', { domain, hash, timer, counter })
  try {
    const result = await domainsStates()
      .transacting(trx)
      .where(DOMAINS_STATES_COLUMNS.domainHash, hash)
      .first()
      .timeout(DB_TIMEOUT)

    if (!result) {
      await insertRecord(new DomainState(hash, counter, timer), trx)
    } else {
      await domainsStates()
        .transacting(trx)
        .where(DOMAINS_STATES_COLUMNS.domainHash, hash)
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

async function insertRecord(data: DomainState, trx: Transaction<DomainState>) {
  return domainsStates().transacting(trx).insert(data).timeout(DB_TIMEOUT)
}
