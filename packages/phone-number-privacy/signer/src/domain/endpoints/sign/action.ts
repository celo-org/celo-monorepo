import { timeout } from '@celo/base'
import {
  Domain,
  domainHash,
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  ErrorType,
  ThresholdPoprfServer,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { EIP712Optional } from '@celo/utils/lib/sign-typed-data-utils'
import { Knex } from 'knex'
import { Action, Session } from '../../../common/action'
import {
  DomainStateRecord,
  toSequentialDelayDomainState,
} from '../../../common/database/models/domain-state'
import { DefaultKeyName, Key, KeyProvider } from '../../../common/key-management/key-provider-base'
import { SignerConfig } from '../../../config'
import { DomainQuotaService } from '../../services/quota'
import { DomainSession } from '../../session'
import { DomainSignIO } from './io'

// TODO(2.0.0, refactor): find a cleaner way to do this
type TrxResult =
  | {
      success: false
      status: number
      domainStateRecord: DomainStateRecord
      error: ErrorType
    }
  | {
      success: true
      status: number
      domainStateRecord: DomainStateRecord
      key: Key
      signature: string
    }

export class DomainSignAction implements Action<DomainRestrictedSignatureRequest> {
  constructor(
    readonly db: Knex,
    readonly config: SignerConfig,
    readonly quota: DomainQuotaService,
    readonly keyProvider: KeyProvider,
    readonly io: DomainSignIO
  ) {}

  public async perform(session: DomainSession<DomainRestrictedSignatureRequest>): Promise<void> {
    const domain = session.request.body.domain
    session.logger.info(
      {
        name: domain.name,
        version: domain.version,
        hash: domainHash(domain).toString('hex'),
      },
      'Processing request to get domain signature '
    )
    const timeoutRes = Symbol()
    try {
      const res: TrxResult = await this.db.transaction(async (trx) => {
        const domainSignHandler = async (): Promise<TrxResult> => {
          // Get the current domain state record, or use an empty record if one does not exist.
          const domainStateRecord = await this.quota.getQuotaStatus(session, trx)

          // Note that this action occurs in the same transaction as the remainder of the siging
          // action. As a result, this is included here rather than in the authentication function.
          if (!this.nonceCheck(domainStateRecord, session)) {
            return {
              success: false,
              status: 401,
              domainStateRecord,
              error: WarningMessage.INVALID_NONCE,
            }
          }

          const quotaStatus = await this.quota.checkAndUpdateQuotaStatus(
            domainStateRecord,
            session,
            trx
          )

          if (!quotaStatus.sufficient) {
            session.logger.warn(
              {
                name: domain.name,
                version: domain.version,
                hash: domainHash(domain),
              },
              `Exceeded quota`
            )
            return {
              success: false,
              status: 429,
              domainStateRecord: quotaStatus.state,
              error: WarningMessage.EXCEEDED_QUOTA,
            }
          }

          const key: Key = {
            version:
              this.io.getRequestKeyVersion(session.request, session.logger) ??
              this.config.keystore.keys.domains.latest,
            name: DefaultKeyName.DOMAINS,
          }

          // Compute evaluation inside transaction so it will rollback on error.
          const evaluation = await this.eval(
            domain,
            session.request.body.blindedMessage,
            key,
            session
          )

          return {
            success: true,
            status: 200,
            domainStateRecord: quotaStatus.state,
            key,
            signature: evaluation.toString('base64'),
          }
        }
        return await timeout(domainSignHandler, [], this.config.timeout, timeoutRes)
      })

      if (res.success) {
        this.io.sendSuccess(
          res.status,
          session.response,
          res.key,
          res.signature,
          toSequentialDelayDomainState(res.domainStateRecord)
        )
      } else {
        this.io.sendFailure(
          res.error,
          res.status,
          session.response,
          toSequentialDelayDomainState(res.domainStateRecord)
        )
      }
    } catch (error) {
      // TODO EN: try to move this into outer controller class
      if (error === timeoutRes) {
        this.io.sendFailure(ErrorMessage.TIMEOUT_FROM_SIGNER, 500, session.response)
        return
      }
      session.logger.error(error, 'Failed to get signature for a domain')
      this.io.sendFailure(ErrorMessage.DATABASE_UPDATE_FAILURE, 500, session.response)
    }
  }

  private nonceCheck(
    domainStateRecord: DomainStateRecord,
    session: DomainSession<DomainRestrictedSignatureRequest>
  ): boolean {
    const nonce: EIP712Optional<number> = session.request.body.options.nonce
    if (!nonce.defined) {
      session.logger.info('Nonce is undefined')
      return false
    }
    return nonce.value >= domainStateRecord.counter
  }

  private async eval(
    domain: Domain,
    blindedMessage: string,
    key: Key,
    session: Session<DomainRestrictedSignatureRequest>
  ): Promise<Buffer> {
    let privateKey: string
    try {
      privateKey = await this.keyProvider.getPrivateKeyOrFetchFromStore(key)
    } catch (err) {
      session.logger.error({ key }, 'Requested key version not supported')
      throw err
    }

    const server = new ThresholdPoprfServer(Buffer.from(privateKey, 'hex'))
    return server.blindPartialEval(domainHash(domain), Buffer.from(blindedMessage, 'base64'))
  }
}
