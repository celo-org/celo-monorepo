import { DB_TIMEOUT, Domain, domainHash, ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Transaction } from 'knex'
import { Counters, Histograms, Labels } from '../../common/metrics'
import { getDatabase } from '../database'
import {
  DomainSigRequest,
  DOMAIN_REQUESTS_COLUMNS,
  DOMAIN_REQUESTS_TABLE,
} from '../models/domainRequest'

function domainRequests() {
  return getDatabase()<DomainSigRequest>(DOMAIN_REQUESTS_TABLE)
}

export async function getDomainRequestExists(
  domain: Domain,
  blindedMessage: string,
  trx: Transaction<DomainSigRequest>,
  logger: Logger
): Promise<boolean> {
  logger.debug({ domain, blindedMessage }, 'Checking if domain request exists')
  const getRequestExistsMeter = Histograms.dbOpsInstrumentation
    .labels('getDomainRequestExists')
    .startTimer()
  try {
    const existingRequest = await domainRequests()
      .transacting(trx)
      .where({
        [DOMAIN_REQUESTS_COLUMNS.domainHash]: domainHash(domain).toString('hex'),
        [DOMAIN_REQUESTS_COLUMNS.blindedMessage]: blindedMessage,
      })
      .first()
      .timeout(DB_TIMEOUT)
    getRequestExistsMeter()
    return !!existingRequest
  } catch (err) {
    Counters.databaseErrors.labels(Labels.read).inc()
    logger.error(ErrorMessage.DATABASE_GET_FAILURE)
    logger.error(err)
    getRequestExistsMeter()
    return false
  }
}

export async function storeDomainRequest(
  domain: Domain,
  blindedMessage: string,
  trx: Transaction<DomainSigRequest>,
  logger: Logger
) {
  const storeRequestMeter = Histograms.dbOpsInstrumentation
    .labels('storeDomainRequest')
    .startTimer()
  logger.debug({ domain, blindedMessage }, 'Storing domain restricted signature request')
  try {
    await domainRequests()
      .transacting(trx)
      .insert(new DomainSigRequest(domain, blindedMessage))
      .timeout(DB_TIMEOUT)
    storeRequestMeter()
    return true
  } catch (err) {
    Counters.databaseErrors.labels(Labels.update).inc()
    logger.error(ErrorMessage.DATABASE_UPDATE_FAILURE)
    logger.error(err)
    storeRequestMeter()
    return null
  }
}
