import {
  authenticateUser,
  DataEncryptionKeyFetcher,
  ErrorMessage,
  ErrorType,
  hasValidAccountParam,
  isBodyReasonablySized,
  PnpQuotaRequest,
  PnpQuotaRequestSchema,
  send,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { PromiseHandler, sendFailure } from '../../../common/handler'
import { Counters } from '../../../common/metrics'
import { getSignerVersion } from '../../../config'
import { PnpQuotaService } from '../../services/quota'

export function createPnpQuotaHandler(
  quota: PnpQuotaService,
  shouldFailOpen: boolean,
  dekFetcher: DataEncryptionKeyFetcher
): PromiseHandler {
  return async (request, response) => {
    const logger = response.locals.logger

    if (!isValidRequest(request)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return
    }

    const warnings: ErrorType[] = []
    if (!(await authenticateUser(request, logger, dekFetcher, shouldFailOpen, warnings))) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return
    }

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

function isValidRequest(
  request: Request<{}, {}, unknown>
): request is Request<{}, {}, PnpQuotaRequest> {
  return (
    PnpQuotaRequestSchema.is(request.body) &&
    hasValidAccountParam(request.body) &&
    isBodyReasonablySized(request.body)
  )
}
