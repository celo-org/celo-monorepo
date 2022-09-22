import { ErrorMessage, SignMessageRequest, WarningMessage } from '@celo/phone-number-privacy-common'
import { Knex } from 'knex'
import { Action, Session } from '../../../common/action'
import { computeBlindedSignature } from '../../../common/bls/bls-cryptography-client'
import { getRequestExists } from '../../../common/database/wrappers/request'
import { DefaultKeyName, Key, KeyProvider } from '../../../common/key-management/key-provider-base'
import { Counters } from '../../../common/metrics'
import { SignerConfig } from '../../../config'
import { PnpQuotaService } from '../../services/quota'
import { PnpSession } from '../../session'
import { PnpSignIO } from './io'
import { LegacyPnpSignIO } from './io.legacy'

export class PnpSignAction implements Action<SignMessageRequest> {
  constructor(
    readonly db: Knex,
    readonly config: SignerConfig,
    readonly quota: PnpQuotaService,
    readonly keyProvider: KeyProvider,
    readonly io: PnpSignIO | LegacyPnpSignIO
  ) {}

  public async perform(session: PnpSession<SignMessageRequest>): Promise<void> {
    // Compute quota lookup, update, and signing within transaction
    // so that these occur atomically and rollback on error.
    await this.db.transaction(async (trx) => {
      const quotaStatus = await this.quota.getQuotaStatus(session, trx)

      let isDuplicateRequest = false
      try {
        isDuplicateRequest = await getRequestExists(
          this.db,
          session.request.body,
          session.logger,
          trx
        )
      } catch (err) {
        session.logger.error({ err }, 'Failed to check if request already exists in db')
      }

      if (isDuplicateRequest) {
        Counters.duplicateRequests.inc()
        session.logger.debug(
          'Request already exists in db. Will service request without charging quota.'
        )
        session.errors.push(WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG)
      } else {
        // In the case of a database connection failure, performedQueryCount will be -1
        if (quotaStatus.performedQueryCount === -1) {
          this.io.sendFailure(
            ErrorMessage.DATABASE_GET_FAILURE,
            500,
            session.response,
            quotaStatus.performedQueryCount,
            quotaStatus.totalQuota,
            quotaStatus.blockNumber
          )
          return
        }
        // In the case of a blockchain connection failure, totalQuota will be -1
        if (quotaStatus.totalQuota === -1) {
          if (this.config.api.phoneNumberPrivacy.shouldFailOpen) {
            // We fail open and service requests on full-node errors to not block the user.
            // Error messages are stored in the session and included along with the signature in the response.
            quotaStatus.totalQuota = Number.MAX_SAFE_INTEGER
            session.logger.error(ErrorMessage.FAILING_OPEN)
            Counters.requestsFailingOpen.inc()
            // TODO(2.0.0) Ensure we have monitoring in the combiner for this too,
            // since we don't have visibility into prometheus metrics for partner signers. The combiner monitoring
            // should be based intelligently off of the warning messages returned by signers
            // (https://github.com/celo-org/celo-monorepo/issues/9836)
          } else {
            session.logger.error(ErrorMessage.FAILING_CLOSED)
            Counters.requestsFailingClosed.inc()
            this.io.sendFailure(
              ErrorMessage.FULL_NODE_ERROR,
              500,
              session.response,
              quotaStatus.performedQueryCount,
              quotaStatus.totalQuota,
              quotaStatus.blockNumber
            )
            return
          }
        }

        // TODO(after 2.0.0) add more specific error messages on DB and key version
        // https://github.com/celo-org/celo-monorepo/issues/9882
        // quotaStatus is updated in place; throws on failure to update
        const { sufficient } = await this.quota.checkAndUpdateQuotaStatus(quotaStatus, session, trx)
        if (!sufficient) {
          this.io.sendFailure(
            WarningMessage.EXCEEDED_QUOTA,
            403,
            session.response,
            quotaStatus.performedQueryCount,
            quotaStatus.totalQuota,
            quotaStatus.blockNumber
          )
          return
        }
      }

      const key: Key = {
        version:
          this.io.getRequestKeyVersion(session.request, session.logger) ??
          this.config.keystore.keys.phoneNumberPrivacy.latest,
        name: DefaultKeyName.PHONE_NUMBER_PRIVACY,
      }

      try {
        const signature = await this.sign(
          session.request.body.blindedQueryPhoneNumber,
          key,
          session
        )
        this.io.sendSuccess(200, session.response, key, signature, quotaStatus, session.errors)
        return
      } catch (err) {
        session.logger.error({ err })
        quotaStatus.performedQueryCount--
        this.io.sendFailure(
          ErrorMessage.SIGNATURE_COMPUTATION_FAILURE,
          500,
          session.response,
          quotaStatus.performedQueryCount, // TODO(2.0.0) consider refactoring to allow quotaStatus to be passed directly here to avoid parameter ordering errors
          quotaStatus.totalQuota,
          quotaStatus.blockNumber
        )
        // Note that errors thrown after rollback will have no effect, hence doing this last
        await trx.rollback()
        return
      }
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
      session.logger.error({ err, key }, 'Requested key version not supported')
      throw err
    }
    return computeBlindedSignature(blindedMessage, privateKey, session.logger)
  }
}
