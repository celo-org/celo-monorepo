import { SignMessageRequest, WarningMessage } from '@celo/phone-number-privacy-common'
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
      } catch (error) {
        session.logger.error({ error }, 'Failed to check if request already exists in db')
      }

      if (isDuplicateRequest) {
        Counters.duplicateRequests.inc()
        session.logger.debug(
          'Request already exists in db. Will service request without charging quota.'
        )
        session.errors.push(WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG)
      } else {
        let failingOpen = false
        // In the case of a database connection failure, performedQueryCount will be -1
        if (quotaStatus.performedQueryCount === -1) {
          quotaStatus.performedQueryCount = 0
          failingOpen = quotaStatus.totalQuota > 0
        }
        // In the case of a blockchain connection failure, totalQuota will be -1
        if (quotaStatus.totalQuota === -1) {
          quotaStatus.totalQuota = Number.MAX_SAFE_INTEGER
          failingOpen = true
        }
        // If performedQueryCount or totalQuota are -1 due to db or blockchain errors
        // we fail open and service the request to not block the user.
        // Error messages are stored in the session and included along
        // with the signature in the response.
        if (failingOpen) {
          session.logger.error(
            'Error fetching PNP quota status in servicing a signing request: failing open.' // TODO(Alec): check this logging
          )
          Counters.requestsFailingOpen.inc()
        }
        const { sufficient, state } = await this.quota.checkAndUpdateQuotaStatus(
          quotaStatus,
          session,
          trx
        )
        if (!sufficient) {
          this.io.sendFailure(
            WarningMessage.EXCEEDED_QUOTA,
            403,
            session.response,
            state.totalQuota,
            state.performedQueryCount,
            state.blockNumber
          )
          return
        }
        quotaStatus.performedQueryCount = state.performedQueryCount
      }

      const key: Key = {
        version:
          this.io.getRequestKeyVersion(session.request, session.logger) ??
          this.config.keystore.keys.phoneNumberPrivacy.latest,
        name: DefaultKeyName.PHONE_NUMBER_PRIVACY,
      }

      // Compute signature inside transaction so it will rollback on error.
      const signature = await this.sign(session.request.body.blindedQueryPhoneNumber, key, session)

      this.io.sendSuccess(200, session.response, key, signature, quotaStatus, session.errors)
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
      session.logger.error({ key }, 'Requested key version not supported')
      throw err
    }
    return computeBlindedSignature(blindedMessage, privateKey, session.logger)
  }
}
