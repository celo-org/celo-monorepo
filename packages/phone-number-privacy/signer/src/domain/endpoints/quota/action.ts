import { domainHash, send } from '@celo/phone-number-privacy-common'
import { toSequentialDelayDomainState } from '../../../common/database/models/domain-state'
import { PromiseHandler } from '../../../common/handler'
import { Counters } from '../../../common/metrics'
import { getSignerVersion } from '../../../config'
import { DomainQuotaService } from '../../services/quota'
import { DomainQuotaIO } from './io'

export function createDomainQuotaHandler(
  quota: DomainQuotaService,
  io: DomainQuotaIO
): PromiseHandler {
  return async (request, response) => {
    if (await io.init(request, response)) {
      const { domain } = request.body
      const logger = response.locals.logger
      logger.info('Processing request to get domain quota status', {
        name: domain.name,
        version: domain.version,
        hash: domainHash(domain).toString('hex'),
      })
      const domainStateRecord = await quota.getQuotaStatus(domain, logger)

      send(
        response,
        {
          success: true,
          version: getSignerVersion(),
          status: toSequentialDelayDomainState(domainStateRecord),
        },
        200,
        response.locals.logger
      )
      Counters.responses.labels(request.url, '200').inc()
    }
  }
}
