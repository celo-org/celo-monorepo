import {
  authenticateUser,
  DataEncryptionKeyFetcher,
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
import { PnpQuotaService } from '../../services/quota'

import { errorResult, PromiseHandler, Result, resultHandler } from '../../../common/handler'

import opentelemetry, { SpanStatusCode } from '@opentelemetry/api'
import Logger from 'bunyan'
const tracer = opentelemetry.trace.getTracer('signer-tracer')

export function createPnpSignHandler(
  db: Knex,
  config: SignerConfig,
  quota: PnpQuotaService,
  keyProvider: KeyProvider,
  dekFetcher: DataEncryptionKeyFetcher
): PromiseHandler {
  return resultHandler(
    async (request, response): Promise<Result<any>> =>
      tracer.startActiveSpan('pnpSignIO - perform', async (span) => {
        try {
          const logger = response.locals.logger

          if (!isValidRequest(request)) {
            return errorResult(400, WarningMessage.INVALID_INPUT)
          }

          if (!requestHasValidKeyVersion(request, logger)) {
            return errorResult(400, WarningMessage.INVALID_KEY_VERSION_REQUEST)
          }

          const warnings: ErrorType[] = []
          if (!(await authenticateUser(request, logger, dekFetcher, warnings))) {
            return errorResult(401, WarningMessage.UNAUTHENTICATED_USER)
          }

          const ctx = {
            url: request.url,
            logger,
            errors: warnings,
          }

          let quotaStatus = await quota.getQuotaStatus(request.body.account, ctx)

          const duplicateRequest = await isDuplicateRequest(
            db,
            request.body.account,
            request.body.blindedQueryPhoneNumber,
            logger
          )

          if (!duplicateRequest && quotaStatus.totalQuota <= quotaStatus.performedQueryCount) {
            logger.warn({ ...quotaStatus }, 'No remaining quota')

            const remainingQuota = quotaStatus.totalQuota - quotaStatus.performedQueryCount
            Histograms.userRemainingQuotaAtRequest.labels(ctx.url).observe(remainingQuota)

            if (bypassQuotaForE2ETesting(config.test_quota_bypass_percentage, request.body)) {
              Counters.testQuotaBypassedRequests.inc()
              logger.info(request.body, 'Request will bypass quota check for e2e testing')
            } else {
              span.addEvent('Not sufficient Quota')
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: WarningMessage.EXCEEDED_QUOTA,
              })
              return errorResult(403, WarningMessage.EXCEEDED_QUOTA, quotaStatus)
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
            span.setStatus({
              code: SpanStatusCode.OK,
              message: response.statusMessage,
            })
          } catch (err) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: ErrorMessage.SIGNATURE_COMPUTATION_FAILURE,
            })

            response.locals.logger.error({ err }, 'catch error on signing')

            return errorResult(500, ErrorMessage.SIGNATURE_COMPUTATION_FAILURE, quotaStatus)
          }

          if (!duplicateRequest) {
            quotaStatus = await quota.updateQuotaStatus(quotaStatus, ctx, request.body)
          } else {
            Counters.duplicateRequests.inc()
            logger.info(
              'Request already exists in db. Will service request without charging quota.'
            )
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
              ...quotaStatus,
              warnings,
            },
          }
        } finally {
          span.end()
        }
      })
  )
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
  try {
    privateKey = await keyProvider.getPrivateKeyOrFetchFromStore(key)
  } catch (err) {
    logger.info({ key }, 'Requested key version not supported')
    logger.error(err)
    throw new Error(WarningMessage.INVALID_KEY_VERSION_REQUEST)
  }
  return computeBlindedSignature(blindedMessage, privateKey, logger)
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
