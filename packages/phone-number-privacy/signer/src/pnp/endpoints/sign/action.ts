import {
  authenticateUser,
  ErrorMessage,
  ErrorType,
  getRequestKeyVersion,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  isBodyReasonablySized,
  KEY_VERSION_HEADER,
  requestHasValidKeyVersion,
  SignMessageRequest,
  SignMessageRequestSchema,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { Knex } from 'knex'
import { computeBlindedSignature } from '../../../common/bls/bls-cryptography-client'
import { getRequestExists } from '../../../common/database/wrappers/request'
import { DefaultKeyName, Key, KeyProvider } from '../../../common/key-management/key-provider-base'
import { Counters, Histograms } from '../../../common/metrics'
import { getSignerVersion, SignerConfig } from '../../../config'

import { errorResult, ResultHandler } from '../../../common/handler'

import Logger from 'bunyan'
import { traceAsyncFunction } from '../../../common/tracing-utils'
import { AccountService } from '../../services/account-service'
import { PnpRequestService } from '../../services/request-service'

export function pnpSign(
  db: Knex,
  config: SignerConfig,
  requestService: PnpRequestService,
  accountService: AccountService,
  keyProvider: KeyProvider
): ResultHandler<SignMessageRequest> {
  return async (request, response) => {
    const logger = response.locals.logger

    if (!isValidRequest(request)) {
      return errorResult(400, WarningMessage.INVALID_INPUT)
    }

    if (!requestHasValidKeyVersion(request, logger)) {
      return errorResult(400, WarningMessage.INVALID_KEY_VERSION_REQUEST)
    }

    const warnings: ErrorType[] = []
    const ctx = {
      url: request.url,
      logger,
      errors: warnings,
    }

    const account = await accountService.getAccount(request.body.account)

    if (!(await authenticateUser(request, logger, async (_) => account.dek, warnings))) {
      return errorResult(401, WarningMessage.UNAUTHENTICATED_USER)
    }

    let usedQuota = await requestService.getUsedQuotaForAccount(request.body.account, ctx)

    const duplicateRequest = await isDuplicateRequest(
      db,
      request.body.account,
      request.body.blindedQueryPhoneNumber,
      logger
    )

    if (!duplicateRequest && account.pnpTotalQuota <= usedQuota) {
      logger.warn({ usedQuota, totalQuota: account.pnpTotalQuota }, 'No remaining quota')

      const remainingQuota = account.pnpTotalQuota - usedQuota
      Histograms.userRemainingQuotaAtRequest.labels(ctx.url).observe(remainingQuota)

      if (bypassQuotaForE2ETesting(config.test_quota_bypass_percentage, request.body)) {
        Counters.testQuotaBypassedRequests.inc()
        logger.info(request.body, 'Request will bypass quota check for e2e testing')
      } else {
        return errorResult(403, WarningMessage.EXCEEDED_QUOTA, {
          performedQueryCount: usedQuota,
          totalQuota: account.pnpTotalQuota,
        })
      }
    }

    const key: Key = {
      version:
        getRequestKeyVersion(request, response.locals.logger) ??
        config.keystore.keys.phoneNumberPrivacy.latest,
      name: DefaultKeyName.PHONE_NUMBER_PRIVACY,
    }

    let signature: string
    try {
      signature = await sign(
        request.body.blindedQueryPhoneNumber,
        key,
        keyProvider,
        response.locals.logger
      )
    } catch (err) {
      response.locals.logger.error({ err }, 'catch error on signing')

      return errorResult(500, ErrorMessage.SIGNATURE_COMPUTATION_FAILURE, {
        performedQueryCount: usedQuota,
        totalQuota: account.pnpTotalQuota,
      })
    }

    if (!duplicateRequest) {
      await requestService.recordRequest(account.address, request.body.blindedQueryPhoneNumber, ctx)
      usedQuota++
    } else {
      Counters.duplicateRequests.inc()
      logger.info('Request already exists in db. Will service request without charging quota.')
      warnings.push(WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG)
    }

    // Send Success response
    response.set(KEY_VERSION_HEADER, key.version.toString())
    return {
      status: 200,
      body: {
        success: true as true,
        version: getSignerVersion(),
        signature,
        performedQueryCount: usedQuota,
        totalQuota: account.pnpTotalQuota,
        warnings,
      },
    }
  }
}

function isDuplicateRequest(
  db: Knex<any, any[]>,
  account: string,
  blindedQueryPhoneNumber: string,
  logger: any
): Promise<boolean> {
  return getRequestExists(db, account, blindedQueryPhoneNumber, logger).catch((err) => {
    logger.error(err, 'Failed to check if request already exists in db')
    return false
  })
}

async function sign(
  blindedMessage: string,
  key: Key,
  keyProvider: KeyProvider,
  logger: Logger
): Promise<string> {
  let privateKey: string
  return traceAsyncFunction('pnpSign', async () => {
    try {
      privateKey = await keyProvider.getPrivateKeyOrFetchFromStore(key)
    } catch (err) {
      logger.info({ key }, 'Requested key version not supported')
      logger.error(err)
      throw new Error(WarningMessage.INVALID_KEY_VERSION_REQUEST)
    }
    return computeBlindedSignature(blindedMessage, privateKey, logger)
  })
}

function isValidRequest(
  request: Request<{}, {}, unknown>
): request is Request<{}, {}, SignMessageRequest> {
  return (
    SignMessageRequestSchema.is(request.body) &&
    hasValidAccountParam(request.body) &&
    hasValidBlindedPhoneNumberParam(request.body) &&
    isBodyReasonablySized(request.body)
  )
}

function bypassQuotaForE2ETesting(
  bypassQuotaPercentage: number,
  requestBody: SignMessageRequest
): boolean {
  const sessionID = Number(requestBody.sessionID)
  return !Number.isNaN(sessionID) && sessionID % 100 < bypassQuotaPercentage
}
