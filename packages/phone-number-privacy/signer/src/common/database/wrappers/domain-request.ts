import { Domain, domainHash, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { config } from '../../../config'
import {
  DOMAIN_REQUESTS_COLUMNS,
  DOMAIN_REQUESTS_TABLE,
  DomainRequestRecord,
  toDomainRequestRecord,
} from '../models/domain-request'
import { doMeteredSql } from '../utils'

// TODO implement replay handling; this file is currently unused
// https://github.com/celo-org/celo-monorepo/issues/9909

export async function getDomainRequestRecordExists<D extends Domain>(
  db: Knex,
  domain: D,
  blindedMessage: string,
  trx: Knex.Transaction<DomainRequestRecord>,
  logger: Logger
): Promise<boolean> {
  const hash = domainHash(domain).toString('hex')
  logger.debug({ domain, blindedMessage, hash }, 'Checking if domain request exists')
  return doMeteredSql(
    'getDomainRequestRecordExists',
    ErrorMessage.DATABASE_GET_FAILURE,
    logger,
    async () => {
      const existingRequest = await db<DomainRequestRecord>(DOMAIN_REQUESTS_TABLE)
        .transacting(trx)
        .where({
          [DOMAIN_REQUESTS_COLUMNS.domainHash]: hash,
          [DOMAIN_REQUESTS_COLUMNS.blindedMessage]: blindedMessage,
        })
        .first()
        .timeout(config.db.timeout)
      return !!existingRequest
    }
  )
}

export async function storeDomainRequestRecord<D extends Domain>(
  db: Knex,
  domain: D,
  blindedMessage: string,
  trx: Knex.Transaction<DomainRequestRecord>,
  logger: Logger
) {
  logger.debug({ domain, blindedMessage }, 'Storing domain restricted signature request')
  return doMeteredSql(
    'storeDomainRequestRecord',
    ErrorMessage.DATABASE_INSERT_FAILURE,
    logger,
    async () => {
      await db<DomainRequestRecord>(DOMAIN_REQUESTS_TABLE)
        .transacting(trx)
        .insert(toDomainRequestRecord(domain, blindedMessage))
        .timeout(config.db.timeout)
    }
  )
}

export async function deleteDomainRequestsOlderThan(
  db: Knex,
  date: Date,
  logger: Logger,
  trx?: Knex.Transaction
): Promise<number> {
  logger.debug(`Removing request older than: ${date}`)
  if (date > new Date()) {
    logger.debug('Date is in the future')
    return 0
  }
  return doMeteredSql(
    'deleteDomainRequestsOlderThan',
    ErrorMessage.DATABASE_REMOVE_FAILURE,
    logger,
    async () => {
      const sql = db<DomainRequestRecord>(DOMAIN_REQUESTS_TABLE)
        .where(DOMAIN_REQUESTS_COLUMNS.timestamp, '<=', date)
        .del()
      return trx != null ? sql.transacting(trx) : sql
    }
  )
}
