import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import { Domain, domainHash } from '@celo/phone-number-privacy-common/lib/domains'
import Logger from 'bunyan'
import { Transaction } from 'knex'
import { Counters, Histograms, Labels } from '../../common/metrics'
import { getDatabase } from '../database'
import { DomainStateRecord, DOMAIN_STATE_COLUMNS, DOMAIN_STATE_TABLE } from '../models/domainState'

function domainStates<D extends Domain>() {
  return getDatabase()<DomainStateRecord<D>>(DOMAIN_STATE_TABLE)
}

export async function setDomainDisabled<D extends Domain>(
  domain: D,
  trx: Transaction<DomainStateRecord<D>>,
  logger: Logger
): Promise<void> {
  const disableDomainMeter = Histograms.dbOpsInstrumentation.labels('disableDomain').startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug('Disabling domain', { hash, domain })
  try {
    await domainStates()
      .transacting(trx)
      .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
      .update(DOMAIN_STATE_COLUMNS.disabled, true)
      .timeout(DB_TIMEOUT)
  } catch (err) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error(err)
    throw err
  } finally {
    disableDomainMeter()
  }
}

export async function getDomainStateRecordOrEmpty(
  domain: Domain,
  logger: Logger,
  trx?: Transaction
): Promise<DomainStateRecord<Domain>> {
  return (await getDomainStateRecord(domain, logger, trx)) ?? createEmptyDomainStateRecord(domain)
}

export function createEmptyDomainStateRecord(domain: Domain) {
  return new DomainStateRecord(domain, {
    timer: 0,
    counter: 0,
    disabled: false,
    date: 0, // TODO(Alec)(Next)
  })
}

export async function getDomainStateRecord<D extends Domain>(
  domain: D,
  logger: Logger,
  trx?: Transaction<DomainStateRecord<D>>
): Promise<DomainStateRecord<D> | null> {
  const getDomainStateRecordWithLockMeter = Histograms.dbOpsInstrumentation
    .labels('getDomainStateRecordWithLock')
    .startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug('Getting domain state from db with lock', { hash, domain })
  try {
    const result = trx
      ? await domainStates()
          .transacting(trx)
          .forUpdate()
          .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
          .first()
          .timeout(DB_TIMEOUT)
      : await domainStates()
          .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
          .first()
          .timeout(DB_TIMEOUT)
    return result ?? null
  } catch (error) {
    Counters.databaseErrors.labels(Labels.read).inc()
    logger.error({ error }, ErrorMessage.DATABASE_GET_FAILURE)
    throw new Error(ErrorMessage.DATABASE_GET_FAILURE)
  } finally {
    getDomainStateRecordWithLockMeter()
  }
}

export async function updateDomainStateRecord<D extends Domain>(
  domain: D,
  domainState: DomainStateRecord<D>,
  trx: Transaction<DomainStateRecord<D>>,
  logger: Logger
): Promise<void> {
  const updateDomainStateRecordMeter = Histograms.dbOpsInstrumentation
    .labels('updateDomainStateRecord')
    .startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug('Update domain state', { hash, domain, domainState })
  try {
    // Check whether the domain is already in the database.
    // TODO(victor): Usage of this in the signature flow results in redudant queries of the current
    // state. It would be good to refactor this to avoid making more than one SELECT.
    const result = await domainStates()
      .transacting(trx)
      .forUpdate()
      .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
      .first()
      .timeout(DB_TIMEOUT)

    // Insert or update the domain state record.
    if (!result) {
      await insertDomainStateRecord(domainState, trx, logger)
    } else {
      await domainStates()
        .transacting(trx)
        .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
        .update(domainState)
        .timeout(DB_TIMEOUT)
    }
  } catch (error) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error({ error }, ErrorMessage.DATABASE_UPDATE_FAILURE)
    throw error
  } finally {
    updateDomainStateRecordMeter()
  }
}

export async function insertDomainStateRecord<D extends Domain>(
  domainState: DomainStateRecord<D>,
  trx: Transaction<DomainStateRecord<D>>,
  logger: Logger
): Promise<DomainStateRecord<D>> {
  const insertDomainStateRecordMeter = Histograms.dbOpsInstrumentation
    .labels('insertDomainState')
    .startTimer()
  logger.debug('Insert domain state', { domainState })
  try {
    await domainStates().transacting(trx).insert(domainState).timeout(DB_TIMEOUT)
    return domainState
  } catch (error) {
    Counters.databaseErrors.labels(Labels.insert).inc()
    logger.error({ error }, ErrorMessage.DATABASE_INSERT_FAILURE)
    throw error
  } finally {
    insertDomainStateRecordMeter()
  }
}
