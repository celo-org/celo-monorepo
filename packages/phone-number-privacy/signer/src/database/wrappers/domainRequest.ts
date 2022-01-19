import {
  DB_TIMEOUT,
  domainHash,
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  KnownDomain,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Counters, Histograms, Labels } from '../../common/metrics'
import { getDatabase } from '../database'
import {
  DOMAIN_REQUESTS_COLUMNS,
  DOMAIN_REQUESTS_TABLE,
  DomainRequest,
} from '../models/domainRequest'

function domainRequests() {
  return getDatabase()<DomainRequest>(DOMAIN_REQUESTS_TABLE)
}

export async function getDomainRequestExists(
  request: DomainRestrictedSignatureRequest<KnownDomain>,
  logger: Logger
): Promise<boolean> {
  logger.debug({ request }, 'Checking if domain request exists')
  const getRequestExistsMeter = Histograms.dbOpsInstrumentation
    .labels('getDomainRequestExists')
    .startTimer()
  try {
    const existingRequest = await domainRequests()
      .where({
        [DOMAIN_REQUESTS_COLUMNS.domainHash]: domainHash(request.domain).toString('hex'),
        [DOMAIN_REQUESTS_COLUMNS.blindedMessage]: request.blindedMessage,
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
  request: DomainRestrictedSignatureRequest<KnownDomain>,
  logger: Logger
) {
  const storeRequestMeter = Histograms.dbOpsInstrumentation
    .labels('storeDomainRequest')
    .startTimer()
  logger.debug({ request }, 'Storing domain restricted signature request')
  try {
    await domainRequests().insert(new DomainRequest(request)).timeout(DB_TIMEOUT)
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
