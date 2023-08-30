import { ErrorMessage } from '@celo/phone-number-privacy-common'
import { Domain, domainHash } from '@celo/phone-number-privacy-common/lib/domains'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { config } from '../../../config'
import {
  DOMAIN_STATE_COLUMNS,
  DOMAIN_STATE_TABLE,
  DomainStateRecord,
  toDomainStateRecord,
} from '../models/domain-state'
import { doMeteredSql } from '../utils'

export async function setDomainDisabled<D extends Domain>(
  db: Knex,
  domain: D,
  trx: Knex.Transaction<DomainStateRecord>,
  logger: Logger
): Promise<void> {
  const hash = domainHash(domain).toString('hex')
  logger.debug({ hash, domain }, 'Disabling domain')
  return doMeteredSql('disableDomain', ErrorMessage.DATABASE_UPDATE_FAILURE, logger, async () => {
    await db<DomainStateRecord>(DOMAIN_STATE_TABLE)
      .transacting(trx)
      .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
      .update(DOMAIN_STATE_COLUMNS.disabled, true)
      .timeout(config.db.timeout)
  })
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
  const hash = domainHash(domain).toString('hex')
  logger.debug({ hash, domain }, 'Getting domain state from db')
  return doMeteredSql(
    'getDomainStateRecord',
    ErrorMessage.DATABASE_GET_FAILURE,
    logger,
    async () => {
      const sql = db<DomainStateRecord>(DOMAIN_STATE_TABLE)
        .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
        .first()
        .timeout(config.db.timeout)

      const result = await (trx != null ? sql.transacting(trx) : sql)
      // bools are stored in db as ints (1 or 0), so we must cast them back
      if (result) {
        result.disabled = !!result.disabled
      }

      return result ?? null
    }
  )
}

export async function updateDomainStateRecord<D extends Domain>(
  db: Knex,
  domain: D,
  domainState: DomainStateRecord,
  trx: Knex.Transaction<DomainStateRecord>,
  logger: Logger
): Promise<void> {
  const hash = domainHash(domain).toString('hex')
  logger.debug({ hash, domain, domainState }, 'Update domain state')
  return doMeteredSql(
    'updateDomainStateRecord',
    ErrorMessage.DATABASE_UPDATE_FAILURE,
    logger,
    async () => {
      // Check whether the domain is already in the database.
      // The current signature flow results in redundant queries of the domain state.
      // Consider optimizing in the future: https://github.com/celo-org/celo-monorepo/issues/9855
      const result = await getDomainStateRecord(db, domain, logger, trx)

      // Insert or update the domain state record.
      if (!result) {
        await insertDomainStateRecord(db, domainState, trx, logger)
      } else {
        await db<DomainStateRecord>(DOMAIN_STATE_TABLE)
          .transacting(trx)
          .where(DOMAIN_STATE_COLUMNS.domainHash, hash)
          .update(domainState)
          .timeout(config.db.timeout)
      }
    }
  )
}

export async function insertDomainStateRecord(
  db: Knex,
  domainState: DomainStateRecord,
  trx: Knex.Transaction<DomainStateRecord>,
  logger: Logger
): Promise<DomainStateRecord> {
  logger.debug({ domainState }, 'Insert domain state')
  return doMeteredSql(
    'insertDomainState',
    ErrorMessage.DATABASE_INSERT_FAILURE,
    logger,
    async () => {
      await db<DomainStateRecord>(DOMAIN_STATE_TABLE)
        .transacting(trx)
        .insert(domainState)
        .timeout(config.db.timeout)
      return domainState
    }
  )
}
