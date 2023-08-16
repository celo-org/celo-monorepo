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
import { REQUESTS_TABLE } from '../../../common/database/models/request'
import { getRequestExists } from '../../../common/database/wrappers/request'
import { DefaultKeyName, Key, KeyProvider } from '../../../common/key-management/key-provider-base'
import { Counters, Histograms } from '../../../common/metrics'
import { getSignerVersion, SignerConfig } from '../../../config'
import { PnpQuotaService } from '../../services/quota'

import { errorResult, PromiseHandler, Result, resultHandler } from '../../../common/handler'

import opentelemetry, { SpanStatusCode } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import Logger from 'bunyan'
const tracer = opentelemetry.trace.getTracer('signer-tracer')

export function createPnpSignHandler(
  db: Knex,
  config: SignerConfig,
  quota: PnpQuotaService,
  keyProvider: KeyProvider,
  shouldFailOpen: boolean,
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
          if (!(await authenticateUser(request, logger, dekFetcher, shouldFailOpen, warnings))) {
            return errorResult(401, WarningMessage.UNAUTHENTICATED_USER)
          }

          const ctx = {
            url: request.url,
            logger,
            errors: warnings,
          }

          let quotaStatus = await quota.getQuotaStatus(request.body.account, ctx)
          span.addEvent('Got quotaStatus')

          const duplicateRequest = await isDuplicateRequest(
            db,
            request.body.account,
            request.body.blindedQueryPhoneNumber,
            logger
          )

          if (duplicateRequest) {
            span.addEvent('Request already exists in db')
            Counters.duplicateRequests.inc()
            logger.info(
              'Request already exists in db. Will service request without charging quota.'
            )
            warnings.push(WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG)
          } else {
            // In the case of a database connection failure, performedQueryCount will be -1
            if (quotaStatus.performedQueryCount === -1) {
              span.addEvent('Database connection failure')
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: ErrorMessage.DATABASE_GET_FAILURE,
              })
              return errorResult(500, ErrorMessage.DATABASE_GET_FAILURE, quotaStatus)
            }

            // In the case of a blockchain connection failure, totalQuota will be -1
            if (quotaStatus.totalQuota === -1 && !shouldFailOpen) {
              span.addEvent('Blockchain connection failure FailClosed')
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA + ErrorMessage.FAILING_CLOSED,
              })
              span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 500)
              logger.warn(
                { warning: ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA },
                ErrorMessage.FAILING_CLOSED
              )
              Counters.requestsFailingClosed.inc()

              return errorResult(500, ErrorMessage.FULL_NODE_ERROR, quotaStatus)
            }

            if (quotaStatus.totalQuota === -1 && shouldFailOpen) {
              span.addEvent('Blockchain connection failure FailOpen')
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA + ErrorMessage.FAILING_OPEN,
              })
              // We fail open and service requests on full-node errors to not block the user.
              // Error messages are stored in the session and included along with the signature in the response.
              quotaStatus.totalQuota = Number.MAX_SAFE_INTEGER
              logger.warn(
                { warning: ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA },
                ErrorMessage.FAILING_OPEN
              )
              Counters.requestsFailingOpen.inc()
            }

            if (quotaStatus.totalQuota <= quotaStatus.performedQueryCount) {
              const remainingQuota = quotaStatus.totalQuota - quotaStatus.performedQueryCount
              Histograms.userRemainingQuotaAtRequest.labels(ctx.url).observe(remainingQuota)
              ctx.logger.warn({ ...quotaStatus }, 'No remaining quota')
              // if (this.bypassQuotaForE2ETesting(body)) {
              //   Counters.testQuotaBypassedRequests.inc()
              //   ctx.logger.info(body, 'Request will bypass quota check for e2e testing')
              //   sufficient = true
              // }

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
            span.addEvent('Signing request')
            signature = await sign(
              request.body.blindedQueryPhoneNumber,
              key,
              keyProvider,
              response.locals.logger
            )
            span.addEvent('Signed request')
            span.setStatus({
              code: SpanStatusCode.OK,
              message: response.statusMessage,
            })
          } catch (err) {
            span.addEvent('Signature computation error')
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: ErrorMessage.SIGNATURE_COMPUTATION_FAILURE,
            })

            span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 500)
            response.locals.logger.error({ err }, 'catch error on signing')

            return errorResult(500, ErrorMessage.SIGNATURE_COMPUTATION_FAILURE, quotaStatus)
          }

          if (!duplicateRequest) {
            quotaStatus = await quota.updateQuotaStatus(quotaStatus, ctx, request.body, db)
          }

          // Send Success response
          span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 200)
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
  return getRequestExists(
    db,
    REQUESTS_TABLE.ONCHAIN,
    account,
    blindedQueryPhoneNumber,
    logger
  ).catch((err) => {
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
