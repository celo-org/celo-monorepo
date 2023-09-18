import {
  authenticateUser,
  CombinerEndpoint,
  ErrorMessage,
  ErrorType,
  getSignerEndpoint,
  hasValidAccountParam,
  isBodyReasonablySized,
  PnpQuotaRequest,
  PnpQuotaRequestSchema,
  PnpQuotaResponseSchema,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { errorResult, ResultHandler } from '../../../common/handlers'
import { getKeyVersionInfo } from '../../../common/io'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { NoQuotaCache } from '../../../utils/no-quota-cache'
import { AccountService } from '../../services/account-services'
import { logPnpSignerResponseDiscrepancies } from '../../services/log-responses'
import { findCombinerQuotaState } from '../../services/threshold-state'

export function pnpQuota(
  signers: Signer[],
  config: OdisConfig,
  accountService: AccountService,
  noQuotaCache: NoQuotaCache
): ResultHandler<PnpQuotaRequest> {
  return async (request, response) => {
    const logger = response.locals.logger

    if (!isValidRequest(request)) {
      return errorResult(400, WarningMessage.INVALID_INPUT)
    }

    const warnings: ErrorType[] = []
    if (config.shouldAuthenticate) {
      if (!(await authenticateUser(request, logger, accountService.getAccount, warnings))) {
        return errorResult(401, WarningMessage.UNAUTHENTICATED_USER)
      }
    }

    const account = request.body.account
    if (config.shouldCheckQuota) {
      if (noQuotaCache.maximumQuotaReached(account)) {
        const quota = noQuotaCache.getTotalQuota(account)
        // can exist a race condition between the hasQuota and getTotalQuota but that's highly improbable
        if (quota !== undefined) {
          return {
            status: 200,
            body: {
              success: true,
              version: getCombinerVersion(),
              performedQueryCount: quota,
              totalQuota: quota,
              warnings,
            },
          }
        }
      }
    }

    // TODO remove this, we shouldn't need keyVersionInfo for non-signing endpoints
    const keyVersionInfo = getKeyVersionInfo(request, config, logger)

    const { signerResponses, maxErrorCode } = await thresholdCallToSigners(logger, {
      signers,
      endpoint: getSignerEndpoint(CombinerEndpoint.PNP_QUOTA),
      request,
      keyVersionInfo,
      requestTimeoutMS: config.odisServices.timeoutMilliSeconds,
      responseSchema: PnpQuotaResponseSchema,
      shouldCheckKeyVersion: false,
    })
    warnings.push(...logPnpSignerResponseDiscrepancies(logger, signerResponses))

    const { threshold } = keyVersionInfo

    if (signerResponses.length >= threshold) {
      try {
        const quotaStatus = findCombinerQuotaState(keyVersionInfo, signerResponses, warnings)

        if (quotaStatus.performedQueryCount === quotaStatus.totalQuota) {
          // Sets that there is not more quota for that account
          noQuotaCache.setNoMoreQuota(account, quotaStatus.totalQuota)
        }
        return {
          status: 200,
          body: {
            success: true,
            version: getCombinerVersion(),
            ...quotaStatus,
            warnings,
          },
        }
      } catch (err) {
        logger.error(err, 'Error combining signer quota status responses')
      }
    }
    return errorResult(maxErrorCode ?? 500, ErrorMessage.THRESHOLD_PNP_QUOTA_STATUS_FAILURE)
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
