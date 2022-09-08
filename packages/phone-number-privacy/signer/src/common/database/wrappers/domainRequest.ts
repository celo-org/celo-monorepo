import { DB_TIMEOUT, Domain, domainHash, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Knex } from 'knex'
import { Histograms, meter } from '../../metrics'
import {
  DomainRequestRecord,
  DOMAIN_REQUESTS_COLUMNS,
  DOMAIN_REQUESTS_TABLE,
} from '../models/domainRequest'
import { countAndThrowDBError } from '../utils'

function domainRequests(db: Knex) {
  return db<DomainRequestRecord<Domain>>(DOMAIN_REQUESTS_TABLE)
}

export async function getDomainRequestRecordExists<D extends Domain>(
  db: Knex,
  domain: D,
  blindedMessage: string,
  trx: Knex.Transaction<DomainRequestRecord<D>>,
  logger: Logger
): Promise<boolean> {
  return meter(
    async () => {
      const hash = domainHash(domain).toString('hex')
      logger.debug({ domain, blindedMessage, hash }, 'Checking if domain request exists')
      const existingRequest = await domainRequests(db)
        .transacting(trx)
        .where({
          [DOMAIN_REQUESTS_COLUMNS.domainHash]: hash,
          [DOMAIN_REQUESTS_COLUMNS.blindedMessage]: blindedMessage,
        })
        .first()
        .timeout(DB_TIMEOUT)
      return !!existingRequest
    },
    [],
    (err: any) => countAndThrowDBError(err, logger, ErrorMessage.DATABASE_GET_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['getDomainRequestRecordExists']
  )
}

export async function storeDomainRequestRecord<D extends Domain>(
  db: Knex,
  domain: D,
  blindedMessage: string,
  trx: Knex.Transaction<DomainRequestRecord<D>>,
  logger: Logger
) {
  return meter(
    async () => {
      logger.debug({ domain, blindedMessage }, 'Storing domain restricted signature request')
      await domainRequests(db)
        .transacting(trx)
        .insert(new DomainRequestRecord(domain, blindedMessage))
        .timeout(DB_TIMEOUT)
    },
    [],
    (err: any) => countAndThrowDBError(err, logger, ErrorMessage.DATABASE_INSERT_FAILURE),
    Histograms.dbOpsInstrumentation,
    ['storeDomainRequestRecord']
  )
}
