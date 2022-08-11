import { DB_TIMEOUT, ErrorMessage } from '@celo/phone-number-privacy-common'
import { Domain, domainHash } from '@celo/phone-number-privacy-common/lib/domains'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { Counters, Histograms, Labels } from '../../../common/metrics'
import {
  DOMAIN_STATE_COLUMNS,
  DOMAIN_STATE_TABLE,
  DomainStateRecord,
  toDomainStateRecord,
} from '../models/domainState'

function domainStates(db: Knex) {
  return db<DomainStateRecord>(DOMAIN_STATE_TABLE)
}

export async function setDomainDisabled<D extends Domain>(
  db: Knex,
  domain: D,
  trx: Knex.Transaction<DomainStateRecord>,
  logger: Logger
): Promise<void> {
  const disableDomainMeter = Histograms.dbOpsInstrumentation.labels('disableDomain').startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug({ hash, domain }, 'Disabling domain')
  try {
    await domainStates(db)
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
  db: Knex,
  domain: Domain,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<DomainStateRecord> {
  return (
    (await getDomainStateRecord(db, domain, logger, trx)) ?? createEmptyDomainStateRecord(domain)
  )
}

export function createEmptyDomainStateRecord(domain: Domain) {
  return toDomainStateRecord(domain, {
    timer: 0,
    counter: 0,
    disabled: false,
    now: 0,
  })
}

export async function getDomainStateRecord<D extends Domain>(
  db: Knex,
  domain: D,
  logger: Logger,
  trx?: Knex.Transaction<DomainStateRecord>
): Promise<DomainStateRecord | null> {
  const meter = Histograms.dbOpsInstrumentation.labels('getDomainStateRecord').startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug({ hash, domain }, 'Getting domain state from db')
  try {
    const result = trx
      ? await domainStates(db)
          .transacting(trx)
          .forUpdate()
          .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
          .first()
          .timeout(DB_TIMEOUT)
      : await domainStates(db)
          .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
          .first()
          .timeout(DB_TIMEOUT)

    // bools are stored in db as ints (1 or 0), so we must cast them back
    if (result) {
      result.disabled = !!result.disabled
    }

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
  db: Knex,
  domain: D,
  domainState: DomainStateRecord,
  trx: Knex.Transaction<DomainStateRecord>,
  logger: Logger
): Promise<void> {
  const meter = Histograms.dbOpsInstrumentation.labels('updateDomainStateRecord').startTimer()
  const hash = domainHash(domain).toString('hex')
  logger.debug({ hash, domain, domainState }, 'Update domain state')
  try {
    // Check whether the domain is already in the database.
    // TODO(victor): Usage of this in the signature flow results in redudant queries of the current
    // state. It would be good to refactor this to avoid making more than one SELECT.
    const result = await getDomainStateRecord(db, domain, logger, trx)

    // Insert or update the domain state record.
    if (!result) {
      await insertDomainStateRecord(db, domainState, trx, logger)
    } else {
      await domainStates(db)
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

export async function insertDomainStateRecord(
  db: Knex,
  domainState: DomainStateRecord,
  trx: Knex.Transaction<DomainStateRecord>,
  logger: Logger
): Promise<DomainStateRecord> {
  const insertDomainStateRecordMeter = Histograms.dbOpsInstrumentation
    .labels('insertDomainState')
    .startTimer()
  logger.debug({ domainState }, 'Insert domain state')
  try {
    await domainStates(db).transacting(trx).insert(domainState).timeout(DB_TIMEOUT)
    return domainState
  } catch (error) {
    Counters.databaseErrors.labels(Labels.insert).inc()
    logger.error({ error }, ErrorMessage.DATABASE_INSERT_FAILURE)
    throw error
  } finally {
    insertDomainStateRecordMeter()
  }
}
