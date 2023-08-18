import {
  domainHash,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  DomainSchema,
  verifyDomainQuotaStatusRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { toSequentialDelayDomainState } from '../../../common/database/models/domain-state'
import { errorResult, ResultHandler } from '../../../common/handler'
import { getSignerVersion } from '../../../config'
import { DomainQuotaService } from '../../services/quota'

export function domainQuota(quota: DomainQuotaService): ResultHandler<DomainQuotaStatusRequest> {
  return async (request, response) => {
    const { logger } = response.locals

    if (!isValidRequest(request)) {
      return errorResult(400, WarningMessage.INVALID_INPUT)
    }
    if (!verifyDomainQuotaStatusRequestAuthenticity(request.body)) {
      return errorResult(401, WarningMessage.UNAUTHENTICATED_USER)
    }

    const { domain } = request.body

    logger.info('Processing request to get domain quota status', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain).toString('hex'),
    })
    const domainStateRecord = await quota.getQuotaStatus(domain, logger)

    return {
      status: 200,
      body: {
        success: true,
        version: getSignerVersion(),
        status: toSequentialDelayDomainState(domainStateRecord),
      },
    }
  }
}

function isValidRequest(
  request: Request<{}, {}, unknown>
): request is Request<{}, {}, DomainQuotaStatusRequest> {
  return domainQuotaStatusRequestSchema(DomainSchema).is(request.body)
}
