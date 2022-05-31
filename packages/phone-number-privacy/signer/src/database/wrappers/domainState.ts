import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import { Domain, domainHash } from '@celo/phone-number-privacy-common/lib/domains'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { Counters, Histograms, Labels } from '../../common/metrics'
import { getDatabase } from '../database'
import { DomainStateRecord, DOMAIN_STATE_COLUMNS, DOMAIN_STATE_TABLE } from '../models/domainState'

function domainStates() {
  return getDatabase()<DomainStateRecord<Domain>>(DOMAIN_STATE_TABLE)
}

export async function setDomainDisabled<D extends Domain>(
  domain: D,
  trx: Knex.Transaction<DomainStateRecord<D>>,
  logger: Logger
): Promise<void> {
  const disableDomainMeter = Histograms.dbOpsInstrumentation.labels('disableDomain').startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug({ hash, domain }, 'Disabling domain')
  try {
    await domainStates()
      .transacting(trx)
      .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
      .update(DOMAIN_STATE_COLUMNS.disabled, true)
      .timeout(DB_TIMEOUT)
  } catch (error) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error({ error }, ErrorMessage.DATABASE_UPDATE_FAILURE)
    throw error
  } finally {
    disableDomainMeter()
  }
}

export async function getDomainStateRecordOrEmpty(
  domain: Domain,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<DomainStateRecord<Domain>> {
  return (await getDomainStateRecord(domain, logger, trx)) ?? createEmptyDomainStateRecord(domain)
}

export function createEmptyDomainStateRecord(domain: Domain) {
  return new DomainStateRecord(domain, {
    timer: 0,
    counter: 0,
    disabled: false,
    now: 0,
  })
}

export async function getDomainStateRecord<D extends Domain>(
  domain: D,
  logger: Logger,
  trx?: Knex.Transaction<DomainStateRecord<D>>
): Promise<DomainStateRecord<D> | null> {
  const meter = Histograms.dbOpsInstrumentation.labels('getDomainStateRecord').startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug({ hash, domain }, 'Getting domain state from db')
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
    throw error
  } finally {
    meter()
  }
}

export async function updateDomainStateRecord<D extends Domain>(
  domain: D,
  domainState: DomainStateRecord<D>,
  trx: Knex.Transaction<DomainStateRecord<D>>,
  logger: Logger
): Promise<void> {
  const meter = Histograms.dbOpsInstrumentation.labels('updateDomainStateRecord').startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug({ hash, domain, domainState }, 'Update domain state')
  try {
    // Check whether the domain is already in the database.
    // TODO(victor): Usage of this in the signature flow results in redudant queries of the current
    // state. It would be good to refactor this to avoid making more than one SELECT.
    const result = await getDomainStateRecord(domain, logger, trx)

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
    meter()
  }
}

export async function insertDomainStateRecord<D extends Domain>(
  domainState: DomainStateRecord<D>,
  trx: Knex.Transaction<DomainStateRecord<D>>,
  logger: Logger
): Promise<DomainStateRecord<D>> {
  const insertDomainStateRecordMeter = Histograms.dbOpsInstrumentation
    .labels('insertDomainState')
    .startTimer()
  logger.debug({ domainState }, 'Insert domain state')
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
