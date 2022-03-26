import {
  domainHash,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  DomainRestrictedSignatureResponseFailure,
  DomainRestrictedSignatureResponseSuccess,
  DomainSchema,
  DomainState,
  ErrorMessage,
  ErrorType,
  getCombinerEndpoint,
  KEY_VERSION_HEADER,
  send,
  SignerEndpoint,
  verifyDomainRestrictedSignatureRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { EIP712Optional } from '@celo/utils/lib/sign-typed-data-utils'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { computeBlindedSignature } from '../../bls/bls-cryptography-client'
import { Counters } from '../../common/metrics'
import { getVersion } from '../../config'
import { getDatabase } from '../../database/database'
import { DomainStateRecord } from '../../database/models/domainState'
import { getDomainStateRecordOrEmptyWithLock } from '../../database/wrappers/domainState'
import { getKeyProvider } from '../../key-management/key-provider'
import { DefaultKeyName, Key } from '../../key-management/key-provider-base'
import { Controller } from '../controller'
import { Session } from '../session'

export class DomainSign extends Controller<DomainRestrictedSignatureRequest> {
  readonly endpoint = SignerEndpoint.DOMAIN_SIGN
  readonly combinerEndpoint = getCombinerEndpoint(this.endpoint)

  protected async _handle(session: Session<DomainRestrictedSignatureRequest>): Promise<void> {
    const domain = session.request.body.domain
    session.logger.info('Processing request to get domain signature ', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain).toString('hex'),
    })

    try {
      await getDatabase().transaction(async (trx) => {
        // Get the current domain state record, or use an empty record if one does not exist.
        const domainStateRecord = await getDomainStateRecordOrEmptyWithLock(
          domain,
          trx,
          session.logger
        )

        if (!this.nonceCheck(domainStateRecord, session)) {
          return this.sendFailure(
            WarningMessage.UNAUTHENTICATED_USER, // TODO(Alec)
            401,
            session.response,
            session.logger,
            domainStateRecord.toSequentialDelayDomainState()
          )
        }

        const quotaStatus = await this.quotaService.checkAndUpdateQuota(
          domain,
          domainStateRecord,
          trx,
          session.logger
        )

        if (!quotaStatus.sufficient) {
          session.logger.warn(`Exceeded quota`, {
            name: domain.name,
            version: domain.version,
            hash: domainHash(domain),
          })
          return this.sendFailure(
            WarningMessage.EXCEEDED_QUOTA,
            429,
            session.response,
            session.logger,
            quotaStatus.state.toSequentialDelayDomainState()
          )
        }

        // Compute signature inside transaction so it will rollback on error.
        const { signature, key } = await this.sign(session)
        this.sendSuccess(
          200,
          session.response,
          session.logger,
          key,
          signature,
          quotaStatus.state.toSequentialDelayDomainState()
        )
      })
    } catch (error) {
      session.logger.error('Failed to get signature for a domain', error)
      this.sendFailure(ErrorMessage.DATABASE_UPDATE_FAILURE, 500, session.response, session.logger)
    }
  }

  protected nonceCheck(
    domainStateRecord: DomainStateRecord,
    session: Session<DomainRestrictedSignatureRequest>
  ): boolean {
    const nonce: EIP712Optional<number> = session.request.body.options.nonce
    if (!nonce.defined) {
      session.logger.info('Nonce is undefined') // TODO(Alec)
      return false
    }
    return nonce.value >= domainStateRecord.counter
  }

  protected async sign(
    session: Session<DomainRestrictedSignatureRequest>
  ): Promise<{ signature: string; key: Key }> {
    const blindedMessage = session.request.body.blindedMessage
    let keyVersion = Number(session.request.headers[KEY_VERSION_HEADER])
    if (Number.isNaN(keyVersion)) {
      // TODO(Alec): Should we throw here?
      session.logger.warn('Supplied keyVersion in request header is NaN')
      keyVersion = this.config.keystore.keys.domains.latest
    }
    const key: Key = { name: DefaultKeyName.DOMAINS, version: keyVersion }
    const privateKey = await getKeyProvider().getPrivateKeyOrFetchFromStore(key)
    const signature = computeBlindedSignature(blindedMessage, privateKey, session.logger)
    return { signature, key }
  }

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainRestrictedSignatureRequest> {
    return domainRestrictedSignatureRequestSchema(DomainSchema).is(request.body)
  }

  protected authenticate(
    request: Request<{}, {}, DomainRestrictedSignatureRequest>
  ): Promise<boolean> {
    return Promise.resolve(verifyDomainRestrictedSignatureRequestAuthenticity(request.body))
  }

  protected sendSuccess(
    status: number,
    response: Response<DomainRestrictedSignatureResponseSuccess>,
    logger: Logger,
    key: Key,
    signature: string,
    domainState: DomainState
  ) {
    // TODO(Alec): make sure this is happening everywhere it needs to
    response.set(KEY_VERSION_HEADER, key.version.toString())
    send(
      response,
      {
        success: true,
        version: getVersion(),
        signature,
        status: domainState,
      },
      status,
      logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  protected sendFailure(
    error: ErrorType,
    status: number,
    response: Response<DomainRestrictedSignatureResponseFailure>,
    logger: Logger,
    domainState?: DomainState
  ) {
    send(
      response,
      {
        success: false,
        version: getVersion(),
        error,
        status: domainState,
      },
      status,
      logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  protected checkRequestKeyVersion(
    request: Request<{}, {}, DomainRestrictedSignatureRequest>,
    logger: Logger
  ): boolean {
    const keyVersionHeader = request.headers[KEY_VERSION_HEADER]
    logger.info({ keyVersionHeader })
    const requestedKeyVersion = Number(keyVersionHeader)
    if (Number.isNaN(requestedKeyVersion)) {
      logger.warn({ keyVersionHeader }, 'Requested key version is NaN')
      return false
    }
    // TODO(Alec)(Next): should we check against the supported key versions?
    return true
  }
}
