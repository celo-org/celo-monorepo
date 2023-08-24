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
import { countAndThrowDBError, doMeteredSql } from '../utils'

// TODO implement replay handling; this file is currently unused
// https://github.com/celo-org/celo-monorepo/issues/9909

export async function getDomainRequestRecordExists<D extends Domain>(
  db: Knex,
  domain: D,
  blindedMessage: string,
  trx: Knex.Transaction<DomainRequestRecord>,
  logger: Logger
): Promise<boolean> {
  return doMeteredSql(
    'getDomainRequestRecordExists',
    ErrorMessage.DATABASE_GET_FAILURE,
    logger,
    async () => {
      const hash = domainHash(domain).toString('hex')
      logger.debug({ domain, blindedMessage, hash }, 'Checking if domain request exists')
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
  return doMeteredSql(
    'storeDomainRequestRecord',
    ErrorMessage.DATABASE_INSERT_FAILURE,
    logger,
    async () => {
      try {
        logger.debug({ domain, blindedMessage }, 'Storing domain restricted signature request')
        await db<DomainRequestRecord>(DOMAIN_REQUESTS_TABLE)
          .transacting(trx)
          .insert(toDomainRequestRecord(domain, blindedMessage))
          .timeout(config.db.timeout)
      } catch (err) {
        countAndThrowDBError(err, logger, ErrorMessage.DATABASE_INSERT_FAILURE)
      }
    }
  )
}
