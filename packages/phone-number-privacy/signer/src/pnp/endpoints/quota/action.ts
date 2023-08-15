import { ErrorMessage } from '@celo/phone-number-privacy-common'
import { PnpQuotaService } from '../../services/quota'
import { PnpQuotaIO } from './io'
import { PromiseHandler, sendFailure } from '../../../common/handler'

export function createPnpQuotaHandler(quota: PnpQuotaService, io: PnpQuotaIO): PromiseHandler {
  return async (request, response) => {
    const errors: string[] = []
    const quotaStatus = await quota.getQuotaStatus(request.body.account, {
      logger: response.locals.logger,
      url: request.baseUrl,
      errors: errors,
    })
    if (quotaStatus.performedQueryCount > -1 && quotaStatus.totalQuota > -1) {
      io.sendSuccess(200, response, quotaStatus, errors)
      return
    }
    sendFailure(
      quotaStatus.performedQueryCount === -1
        ? ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
        : ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA,
      500,
      response
    )
  }
}
