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
import { Counters } from '../../../common/metrics'
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

          // Compute quota lookup, update, and signing within transaction
          // so that these occur atomically and rollback on error.
          span.addEvent('Calling db transaction')
          const ret = await db.transaction(async (trx): Promise<Result<any>> => {
            span.addEvent('Getting quotaStatus')
            const ctx = {
              url: request.url,
              logger,
              errors: warnings,
            }
            const quotaStatus = await quota.getQuotaStatus(request.body.account, ctx, trx)
            span.addEvent('Got quotaStatus')

            let isDuplicateRequest = false
            try {
              span.addEvent('Getting isDuplicateRequest')
              isDuplicateRequest = await getRequestExists(
                db,
                REQUESTS_TABLE.ONCHAIN,
                request.body.account,
                request.body.blindedQueryPhoneNumber,
                logger,
                trx
              )
              span.addEvent('Got isDuplicateRequest')
            } catch (err) {
              logger.error(err, 'Failed to check if request already exists in db')
              span.addEvent('Error checking if request already exists in db')
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: 'Error checking if request already exists in db',
              })
            }

            if (isDuplicateRequest) {
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
              if (quotaStatus.totalQuota === -1) {
                if (shouldFailOpen) {
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
                } else {
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
              }

              // TODO(after 2.0.0) add more specific error messages on DB and key version
              // https://github.com/celo-org/celo-monorepo/issues/9882
              // quotaStatus is updated in place; throws on failure to update
              // span.addEvent('Calling checkAndUpdateQuotaStatus')
              const { sufficient } = await quota.checkAndUpdateQuotaStatus(
                quotaStatus,
                ctx,
                request.body,
                trx
              )
              if (!sufficient) {
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

            try {
              span.addEvent('Signing request')
              const signature = await sign(
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
            } catch (err) {
              span.addEvent('Signature computation error')
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: ErrorMessage.SIGNATURE_COMPUTATION_FAILURE,
              })
              span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 500)

              response.locals.logger.error({ err }, 'catch error on signing')

              quotaStatus.performedQueryCount--

              response.locals.logger.error('BEFORE ROLLBACK')
              // // Note that errors thrown after rollback will have no effect, hence doing this last
              // await trx.rollback().catch((err) => {
              //   // TODO remove
              //   logger.error({ err }, 'silently ignoreing rollback failure')
              // })
              return errorResult(500, ErrorMessage.SIGNATURE_COMPUTATION_FAILURE, quotaStatus)
            }
          })

          span.addEvent('Called transaction')
          return ret
        } finally {
          span.end()
        }
      })
  )
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
