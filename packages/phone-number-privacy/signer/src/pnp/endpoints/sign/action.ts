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
import { Counters, Histograms, meter } from '../../../common/metrics'
import { SignerConfig } from '../../../config'
import { PnpQuotaService } from '../../services/quota'
import { PnpSession } from '../../session'
import { PnpSignIO } from './io'

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
    await this.db.transaction(async (trx) => {
      const pnpSignHandler = async () => {
        const quotaStatus = await this.quota.getQuotaStatus(session, trx)

        let isDuplicateRequest = false
        try {
          isDuplicateRequest = await getRequestExists(
            this.db,
            this.requestsTable,
            session.request.body.account,
            session.request.body.blindedQueryPhoneNumber,
            session.logger,
            trx
          )
        } catch (err) {
          session.logger.error(err, 'Failed to check if request already exists in db')
        }

        if (isDuplicateRequest) {
          Counters.duplicateRequests.inc()
          session.logger.info(
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
              quotaStatus
            )
            return
          }
          // In the case of a blockchain connection failure, totalQuota will be -1
          if (quotaStatus.totalQuota === -1) {
            if (this.io.shouldFailOpen) {
              // We fail open and service requests on full-node errors to not block the user.
              // Error messages are stored in the session and included along with the signature in the response.
              quotaStatus.totalQuota = Number.MAX_SAFE_INTEGER
              session.logger.warn(
                { warning: ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA },
                ErrorMessage.FAILING_OPEN
              )
              Counters.requestsFailingOpen.inc()
            } else {
              session.logger.warn(
                { warning: ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA },
                ErrorMessage.FAILING_CLOSED
              )
              Counters.requestsFailingClosed.inc()
              this.io.sendFailure(ErrorMessage.FULL_NODE_ERROR, 500, session.response, quotaStatus)
              return
            }
          }

          // TODO(after 2.0.0) add more specific error messages on DB and key version
          // https://github.com/celo-org/celo-monorepo/issues/9882
          // quotaStatus is updated in place; throws on failure to update
          const { sufficient } = await this.quota.checkAndUpdateQuotaStatus(
            quotaStatus,
            session,
            trx
          )
          if (!sufficient) {
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
          const signature = await meter(
            this.sign.bind(this),
            [session.request.body.blindedQueryPhoneNumber, key, session],
            (err: any) => {
              throw err
            },
            Histograms.getBlindedSigInstrumentation,
            ['sign']
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
            quotaStatus
          )
          return
        }
      }
      await timeout(pnpSignHandler, [], this.config.timeout, timeoutError)
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
