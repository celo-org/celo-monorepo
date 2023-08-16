import { ErrorMessage, send } from '@celo/phone-number-privacy-common'
import { PromiseHandler, sendFailure } from '../../../common/handler'
import { Counters } from '../../../common/metrics'
import { getSignerVersion } from '../../../config'
import { PnpQuotaService } from '../../services/quota'
import { InitOutput, PnpQuotaIO } from './io'

export function createPnpQuotaHandler(quota: PnpQuotaService, io: PnpQuotaIO): PromiseHandler {
  return async (request, response) => {
    const [ok, _warnings]: InitOutput = await io.init(request, response)

    if (ok) {
      // TODO fix type isse with the compiler
      const warnings = _warnings as string[]

      const quotaStatus = await quota.getQuotaStatus(request.body.account, {
        logger: response.locals.logger,
        url: request.baseUrl,
        errors: warnings,
      })
      if (quotaStatus.performedQueryCount > -1 && quotaStatus.totalQuota > -1) {
        send(
          response,
          {
            success: true,
            version: getSignerVersion(),
            ...quotaStatus,
            warnings,
          },
          200,
          response.locals.logger
        )
        Counters.responses.labels(request.url, '200').inc()
      } else {
        sendFailure(
          quotaStatus.performedQueryCount === -1
            ? ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT
            : ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA,
          500,
          response
        )
      }
    }
  }
}
