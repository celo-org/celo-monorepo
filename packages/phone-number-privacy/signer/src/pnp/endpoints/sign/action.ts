import { timeout } from '@celo/base'
import {
  ErrorMessage,
  getRequestKeyVersion,
  SignMessageRequest,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import { Action, Session } from '../../../common/action'
import { computeBlindedSignature } from '../../../common/bls/bls-cryptography-client'
import { REQUESTS_TABLE } from '../../../common/database/models/request'
import { getRequestExists } from '../../../common/database/wrappers/request'
import { DefaultKeyName, Key, KeyProvider } from '../../../common/key-management/key-provider-base'
import { Counters } from '../../../common/metrics'
import { SignerConfig } from '../../../config'
import { PnpQuotaService } from '../../services/quota'
import { PnpSession } from '../../session'
import { PnpSignIO } from './io'

import opentelemetry, { SpanStatusCode } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
const tracer = opentelemetry.trace.getTracer('signer-tracer')

export class PnpSignAction implements Action<SignMessageRequest> {
  protected readonly requestsTable: REQUESTS_TABLE = REQUESTS_TABLE.ONCHAIN

  constructor(
    readonly db: Knex,
    readonly config: SignerConfig,
    readonly quota: PnpQuotaService,
    readonly keyProvider: KeyProvider,
    readonly io: PnpSignIO
  ) {}

  public async perform(
    session: PnpSession<SignMessageRequest>,
    timeoutError: symbol
  ): Promise<void> {
    tracer.startActiveSpan('pnpSignIO - perform', async (span) => {
      span.addEvent('Calling db transaction')
      // Compute quota lookup, update, and signing within transaction
      // so that these occur atomically and rollback on error.
      await this.db.transaction(async (trx) => {
        const pnpSignHandler = async () => {
          span.addEvent('Getting quotaStatus')
          const quotaStatus = await this.quota.getQuotaStatus(session, trx)
          span.addEvent('Got quotaStatus')

          let isDuplicateRequest = false
          try {
            span.addEvent('Getting isDuplicateRequest')
            isDuplicateRequest = await getRequestExists(
              this.db,
              this.requestsTable,
              session.request.body.account,
              session.request.body.blindedQueryPhoneNumber,
              session.logger,
              trx
            )
            span.addEvent('Got isDuplicateRequest')
          } catch (err) {
            session.logger.error(err, 'Failed to check if request already exists in db')
            span.addEvent('Error checking if request already exists in db')
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: 'Error checking if request already exists in db',
            })
          }

          if (isDuplicateRequest) {
            span.addEvent('Request already exists in db')
            Counters.duplicateRequests.inc()
            session.logger.info(
              'Request already exists in db. Will service request without charging quota.'
            )
            session.errors.push(WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG)
          } else {
            // In the case of a database connection failure, performedQueryCount will be -1
            if (quotaStatus.performedQueryCount === -1) {
              span.addEvent('Database connection failure')
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: ErrorMessage.DATABASE_GET_FAILURE,
              })
              span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 500)
              this.io.sendFailure(
                ErrorMessage.DATABASE_GET_FAILURE,
                500,
                session.response,
                quotaStatus
              )
              return
            }
            // In the case of a blockchain connection failure, totalQuota will be -1
            if (quotaStatus.totalQuota === -1) {
              if (this.io.shouldFailOpen) {
                span.addEvent('Blockchain connection failure FailOpen')
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA + ErrorMessage.FAILING_OPEN,
                })
                // We fail open and service requests on full-node errors to not block the user.
                // Error messages are stored in the session and included along with the signature in the response.
                quotaStatus.totalQuota = Number.MAX_SAFE_INTEGER
                session.logger.warn(
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
                session.logger.warn(
                  { warning: ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA },
                  ErrorMessage.FAILING_CLOSED
                )
                Counters.requestsFailingClosed.inc()
                this.io.sendFailure(
                  ErrorMessage.FULL_NODE_ERROR,
                  500,
                  session.response,
                  quotaStatus
                )
                return
              }
            }

            // TODO(after 2.0.0) add more specific error messages on DB and key version
            // https://github.com/celo-org/celo-monorepo/issues/9882
            // quotaStatus is updated in place; throws on failure to update
            span.addEvent('Calling checkAndUpdateQuotaStatus')
            const { sufficient } = await this.quota.checkAndUpdateQuotaStatus(
              quotaStatus,
              session,
              trx
            )
            if (!sufficient) {
              span.addEvent('Not sufficient Quota')
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: WarningMessage.EXCEEDED_QUOTA,
              })
              span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 403)
              this.io.sendFailure(WarningMessage.EXCEEDED_QUOTA, 403, session.response, quotaStatus)
              return
            }
          }

          const key: Key = {
            version:
              getRequestKeyVersion(session.request, session.logger) ??
              this.config.keystore.keys.phoneNumberPrivacy.latest,
            name: DefaultKeyName.PHONE_NUMBER_PRIVACY,
          }

          try {
            span.addEvent('Signing request')
            const signature = await this.sign(
              session.request.body.blindedQueryPhoneNumber,
              key,
              session
            )
            span.addEvent('Signed request')
            span.setStatus({
              code: SpanStatusCode.OK,
              message: session.response.statusMessage,
            })
            span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 200)
            this.io.sendSuccess(200, session.response, key, signature, quotaStatus, session.errors)
            return
          } catch (err) {
            span.addEvent('Signature computation error')
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: ErrorMessage.SIGNATURE_COMPUTATION_FAILURE,
            })
            span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 500)
            session.logger.error({ err })
            quotaStatus.performedQueryCount--
            this.io.sendFailure(
              ErrorMessage.SIGNATURE_COMPUTATION_FAILURE,
              500,
              session.response,
              quotaStatus
            )
            span.addEvent('Rolling back transactions')
            // Note that errors thrown after rollback will have no effect, hence doing this last
            await trx.rollback()
            span.addEvent('Transaction rolled back')
            return
          }
        }
        span.addEvent('Calling pnpSignHandler with timeout')
        await timeout(pnpSignHandler, [], this.config.timeout, timeoutError)
        span.addEvent('Called pnpSignHandler with timeout')
      })
      span.addEvent('Called transaction')
      span.end()
    })
  }

  private async sign(
    blindedMessage: string,
    key: Key,
    session: Session<SignMessageRequest>
  ): Promise<string> {
    let privateKey: string
    try {
      privateKey = await this.keyProvider.getPrivateKeyOrFetchFromStore(key)
    } catch (err) {
      session.logger.info({ key }, 'Requested key version not supported')
      session.logger.error(err)
      throw new Error(WarningMessage.INVALID_KEY_VERSION_REQUEST)
    }
    return computeBlindedSignature(blindedMessage, privateKey, session.logger)
  }
}
