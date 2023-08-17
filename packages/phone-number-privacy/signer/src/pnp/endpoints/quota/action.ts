import {
  authenticateUser,
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
import { AccountService, PnpRequestService } from '../../services/quota'

export function createPnpQuotaHandler(
  requestService: PnpRequestService,
  accountService: AccountService
): PromiseHandler {
  return resultHandler(async (request, response) => {
    const logger = response.locals.logger

    if (!isValidRequest(request)) {
      return errorResult(400, WarningMessage.INVALID_INPUT)
    }

    const warnings: ErrorType[] = []
    const ctx = {
      url: request.url,
      logger,
      errors: warnings,
    }

    const account = await accountService.getAccount(request.body.account, ctx)

    if (!(await authenticateUser(request, logger, async (_) => account.dek, warnings))) {
      return errorResult(401, WarningMessage.UNAUTHENTICATED_USER)
    }

    const usedQuota = await requestService.getUsedQuotaForAccount(request.body.account, ctx)

    return {
      status: 200,
      body: {
        success: true,
        version: getSignerVersion(),
        performedQueryCount: usedQuota,
        totalQuota: account.pnpTotalQuota,
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
