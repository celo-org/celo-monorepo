import {
  authenticateUser,
  DataEncryptionKeyFetcher,
  ErrorType,
  hasValidAccountParam,
  isBodyReasonablySized,
  PnpQuotaRequest,
  PnpQuotaRequestSchema,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { errorResult, PromiseHandler, resultHandler } from '../../../common/handler'
import { getSignerVersion } from '../../../config'
import { PnpQuotaService } from '../../services/quota'

export function createPnpQuotaHandler(
  quota: PnpQuotaService,
  dekFetcher: DataEncryptionKeyFetcher
): PromiseHandler {
  return resultHandler(async (request, response) => {
    const logger = response.locals.logger

    if (!isValidRequest(request)) {
      return errorResult(400, WarningMessage.INVALID_INPUT)
    }

    const warnings: ErrorType[] = []
    if (!(await authenticateUser(request, logger, dekFetcher, warnings))) {
      return errorResult(401, WarningMessage.UNAUTHENTICATED_USER)
    }

    const quotaStatus = await quota.getQuotaStatus(request.body.account, {
      logger: response.locals.logger,
      url: request.baseUrl,
      errors: warnings,
    })

    return {
      status: 200,
      body: {
        success: true,
        version: getSignerVersion(),
        ...quotaStatus,
        warnings,
      },
    }
  })
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
