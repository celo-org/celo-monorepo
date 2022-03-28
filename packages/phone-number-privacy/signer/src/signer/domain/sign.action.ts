import {
  domainHash,
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  getCombinerEndpoint,
  SignerEndpoint,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { EIP712Optional } from '@celo/utils/lib/sign-typed-data-utils'
import { Config } from '../../config'
import { getDatabase } from '../../database/database'
import { DomainStateRecord } from '../../database/models/domainState'
import { DefaultKeyName, Key } from '../../key-management/key-provider-base'
import { SignAction } from '../sign.abstract'
import { DomainQuotaService } from './quota.service'
import { DomainSession } from './session'
import { DomainSignIO } from './sign.io'

export class DomainSignAction extends SignAction<DomainRestrictedSignatureRequest> {
  readonly endpoint = SignerEndpoint.DOMAIN_SIGN
  readonly combinerEndpoint = getCombinerEndpoint(this.endpoint)

  constructor(
    readonly config: Config,
    readonly quota: DomainQuotaService,
    readonly io: DomainSignIO
  ) {
    super()
  }

  public async perform(session: DomainSession<DomainRestrictedSignatureRequest>): Promise<void> {
    const domain = session.request.body.domain
    session.logger.info('Processing request to get domain signature ', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain).toString('hex'),
    })

    try {
      await getDatabase().transaction(async (trx) => {
        // Get the current domain state record, or use an empty record if one does not exist.
        const domainStateRecord = await this.quota.getQuotaStatus(session, trx)

        if (!this.nonceCheck(domainStateRecord, session)) {
          return this.io.sendFailure(
            WarningMessage.UNAUTHENTICATED_USER, // TODO(Alec): Different error type
            401,
            session.response,
            domainStateRecord.toSequentialDelayDomainState()
          )
        }

        const quotaStatus = await this.quota.checkAndUpdateQuotaStatus(
          domainStateRecord,
          session,
          trx
        )

        if (!quotaStatus.sufficient) {
          session.logger.warn(`Exceeded quota`, {
            name: domain.name,
            version: domain.version,
            hash: domainHash(domain),
          })
          return this.io.sendFailure(
            WarningMessage.EXCEEDED_QUOTA,
            429,
            session.response,
            quotaStatus.state.toSequentialDelayDomainState()
          )
        }

        const defaultKey: Key = {
          version: this.config.keystore.keys.domains.latest,
          name: DefaultKeyName.DOMAINS,
        }

        // Compute signature inside transaction so it will rollback on error.
        const { signature, key } = await this.sign(
          session.request.body.blindedMessage,
          defaultKey,
          session
        )

        this.io.sendSuccess(
          200,
          session.response,
          key,
          signature,
          quotaStatus.state.toSequentialDelayDomainState()
        )
      })
    } catch (error) {
      session.logger.error('Failed to get signature for a domain', error)
      this.io.sendFailure(ErrorMessage.DATABASE_UPDATE_FAILURE, 500, session.response)
    }
  }

  protected nonceCheck(
    domainStateRecord: DomainStateRecord,
    session: DomainSession<DomainRestrictedSignatureRequest>
  ): boolean {
    const nonce: EIP712Optional<number> = session.request.body.options.nonce
    if (!nonce.defined) {
      session.logger.info('Nonce is undefined') // TODO(Alec): Better logging
      return false
    }
    return nonce.value >= domainStateRecord.counter
  }
}
