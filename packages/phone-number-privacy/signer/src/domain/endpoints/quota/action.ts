import { domainHash } from '@celo/phone-number-privacy-common'
import { toSequentialDelayDomainState } from '../../../common/database/models/domain-state'
import { DomainQuotaService } from '../../services/quota'
import { DomainQuotaIO } from './io'
import { PromiseHandler } from '../../../common/handler'

export function createDomainQuotaHandler(
  quota: DomainQuotaService,
  io: DomainQuotaIO
): PromiseHandler {
  return async (request, response) => {
    const { domain } = request.body
    const { logger } = response.locals.logger
    logger.info('Processing request to get domain quota status', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain).toString('hex'),
    })
    const domainStateRecord = await quota.getQuotaStatus(domain, logger)
    io.sendSuccess(200, response, toSequentialDelayDomainState(domainStateRecord))
  }
}
