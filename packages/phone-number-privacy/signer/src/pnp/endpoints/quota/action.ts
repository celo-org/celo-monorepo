import {
  authenticateUser,
  AuthenticationMethod,
  ErrorType,
  hasValidAccountParam,
  isBodyReasonablySized,
  PnpQuotaRequest,
  PnpQuotaRequestSchema,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { errorResult, ResultHandler } from '../../../common/handler'
import { Counters } from '../../../common/metrics'
import { getSignerVersion } from '../../../config'
import { AccountService } from '../../services/account-service'
import { PnpRequestService } from '../../services/request-service'

export function pnpQuota(
  requestService: PnpRequestService,
  accountService: AccountService
): ResultHandler<PnpQuotaRequest> {
  return async (request, response) => {
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

    const account = await accountService.getAccount(request.body.account)

    if (request.body.authenticationMethod === AuthenticationMethod.WALLET_KEY) {
      Counters.requestsWithWalletAddress.inc()
    }

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
