import { ErrorMessage } from '@celo/phone-number-privacy-common'
import { Domain, domainHash } from '@celo/phone-number-privacy-common/lib/domains'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { config } from '../../../config'
import { Histograms, meter } from '../../metrics'
import {
  DomainStateRecord,
  DOMAIN_STATE_COLUMNS,
  DOMAIN_STATE_TABLE,
  toDomainStateRecord,
} from '../models/domain-state'
import { countAndThrowDBError, queryWithOptionalTrx } from '../utils'

function domainStates(db: Knex) {
  return db<DomainStateRecord>(DOMAIN_STATE_TABLE)
}

export async function setDomainDisabled<D extends Domain>(
  db: Knex,
  domain: D,
  trx: Knex.Transaction<DomainStateRecord>,
  logger: Logger
): Promise<void> {
  return meter(
    async () => {
      const hash = domainHash(domain).toString('hex')
      logger.debug({ hash, domain }, 'Disabling domain')
      await domainStates(db)
        .transacting(trx)
        .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
        .update(DOMAIN_STATE_COLUMNS.disabled, true)
        .timeout(config.db.timeout)
    },
    [],
    (err: any) => countAndThrowDBError(err, logger, ErrorMessage.DATABASE_UPDATE_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['disableDomain']
  )
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

export function createEmptyDomainStateRecord(domain: Domain, disabled: boolean = false) {
  return toDomainStateRecord(domain, {
    timer: 0,
    counter: 0,
    disabled,
    now: 0,
  })
}

export async function getDomainStateRecord<D extends Domain>(
  db: Knex,
  domain: D,
  logger: Logger,
  trx?: Knex.Transaction<DomainStateRecord>
): Promise<DomainStateRecord | null> {
  return meter(
    async () => {
      const hash = domainHash(domain).toString('hex')
      logger.debug({ hash, domain }, 'Getting domain state from db')
      const result = await queryWithOptionalTrx(domainStates(db), trx)
        .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
        .first()
        .timeout(config.db.timeout)

      // bools are stored in db as ints (1 or 0), so we must cast them back
      if (result) {
        result.disabled = !!result.disabled
      }

      return result ?? null
    },
    [],
    (err: any) => countAndThrowDBError(err, logger, ErrorMessage.DATABASE_GET_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['getDomainStateRecord']
  )
}

export async function updateDomainStateRecord<D extends Domain>(
  db: Knex,
  domain: D,
  domainState: DomainStateRecord,
  trx: Knex.Transaction<DomainStateRecord>,
  logger: Logger
): Promise<void> {
  return meter(
    async () => {
      const hash = domainHash(domain).toString('hex')
      logger.debug({ hash, domain, domainState }, 'Update domain state')
      // Check whether the domain is already in the database.
      // The current signature flow results in redundant queries of the domain state.
      // Consider optimizing in the future: https://github.com/celo-org/celo-monorepo/issues/9855
      const result = await getDomainStateRecord(db, domain, logger, trx)

      // Insert or update the domain state record.
      if (!result) {
        await insertDomainStateRecord(db, domainState, trx, logger)
      } else {
        await domainStates(db)
          .transacting(trx)
          .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
          .update(domainState)
          .timeout(config.db.timeout)
      }
    },
    [],
    (err: any) => countAndThrowDBError(err, logger, ErrorMessage.DATABASE_UPDATE_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['updateDomainStateRecord']
  )
}

export async function insertDomainStateRecord(
  db: Knex,
  domainState: DomainStateRecord,
  trx: Knex.Transaction<DomainStateRecord>,
  logger: Logger
): Promise<DomainStateRecord> {
  return meter(
    async () => {
      logger.debug({ domainState }, 'Insert domain state')
      await domainStates(db).transacting(trx).insert(domainState).timeout(config.db.timeout)
      return domainState
    },
    [],
    (err: any) => countAndThrowDBError(err, logger, ErrorMessage.DATABASE_INSERT_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['insertDomainState']
  )
}
