import {
  checkSequentialDelayRateLimit,
  Domain,
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
  isSequentialDelayDomain,
  KEY_VERSION_HEADER,
  send,
  SequentialDelayDomain,
  SignerEndpoint,
  verifyDomainRestrictedSignatureRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Transaction } from 'knex'
import { computeBlindedSignature } from '../../bls/bls-cryptography-client'
import { Counters } from '../../common/metrics'
import { getVersion } from '../../config'
import { getDatabase } from '../../database/database'
import { DomainStateRecord } from '../../database/models/domainState'
import {
  getDomainStateRecordOrEmptyWithLock,
  updateDomainStateRecord,
} from '../../database/wrappers/domainState'
import { getKeyProvider } from '../../key-management/key-provider'
import { DefaultKeyName, Key } from '../../key-management/key-provider-base'
import { Session } from '../session'
import { Signer } from '../signer'

export class DomainSign extends Signer<DomainRestrictedSignatureRequest> {
  readonly endpoint = SignerEndpoint.DOMAIN_SIGN
  readonly combinerEndpoint = getCombinerEndpoint(this.endpoint)

  protected async _handle(session: Session<DomainRestrictedSignatureRequest>): Promise<void> {
    const domain = session.request.body.domain
    session.logger.info('Processing request to get domain signature ', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })

    // Specific to signing
    // TODO(Alec)(Next)
    const blindedMessage = session.request.body.blindedMessage
    let keyVersion = Number(session.request.headers[KEY_VERSION_HEADER])
    if (Number.isNaN(keyVersion)) {
      session.logger.warn('Supplied keyVersion in session.request header is NaN')
      keyVersion = this.config.keystore.keys.domains.latest
    }
    const key: Key = {
      name: DefaultKeyName.DOMAINS,
      version: keyVersion,
    }

    try {
      await getDatabase().transaction(async (trx) => {
        // Get the current domain state record, or use an empty record if one does not exist.
        const domainStateRecord = await getDomainStateRecordOrEmptyWithLock(
          domain,
          trx,
          session.logger
        )

        const quotaStatus = await this.checkAndUpdateQuota(
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
            quotaStatus.newState
          )
        }

        // Compute the signature inside the transaction such that it will rollback on error.
        const keyProvider = getKeyProvider()
        const privateKey = await keyProvider.getPrivateKeyOrFetchFromStore(key)
        const signature = computeBlindedSignature(blindedMessage, privateKey, session.logger)
        // TODO(victor): Checking the existance of the sigature to determine whether this operation
        // succeeded is a little clunky. Refactor this to improve the flow.
        // TODO(Alec): follow up on this
        if (signature) {
          this.sendSuccess(
            200,
            session.response,
            session.logger,
            signature,
            quotaStatus.newState,
            key
          )
        }
      })
    } catch (error) {
      session.logger.error('Failed to get signature for a domain', error)
      this.sendFailure(ErrorMessage.DATABASE_UPDATE_FAILURE, 500, session.response, session.logger)
    }
  }

  // TODO(Alec)(Next)
  protected async checkAndUpdateQuota<D extends Domain>(
    domain: D,
    domainStateRecord: DomainStateRecord<D>,
    trx: Transaction<DomainStateRecord<D>>,
    logger: Logger
  ): Promise<DomainState | undefined> {
    const domainState = domainStateRecord.toSequentialDelayDomainState()
    if (isSequentialDelayDomain(domain)) {
      const result = checkSequentialDelayRateLimit(
        domain,
        Date.now() / 1000, // Divide by 1000 to convert the current time in ms to seconds.
        domainState
      )

      // if (domainState !== result.state) {
      //   throw new Error('TODO(Alec)')
      // }

      // If the result indicates insufficient quota, return a failure.
      // Note that the database will not be updated.
      if (!result.accepted) {
        // result.domainState should === domainState
        return domainState // TODO(Alec): propogate failure
      }

      const newState = new DomainStateRecord<SequentialDelayDomain>(domain, result.state)

      // Persist the updated domain quota to the database.
      // This will trigger an insert if its the first update to the domain instance.
      await updateDomainStateRecord(domain, newState, trx, logger)

      return result.state
    } else {
      throw new Error(ErrorMessage.UNSUPPORTED_DOMAIN)
    }
  }

  // protected async handleSequentialDelayDomain<D extends Domain>(
  //   domain: Domain,
  //   domainStateRecord: DomainStateRecord<D>,
  //   trx: Transaction<DomainStateRecord<D>>,
  //   logger: Logger
  // ): Promise<{ sufficient: boolean; newState: DomainState }> {
  //   const domainState = domainStateRecord.toSequentialDelayDomainState()
  //   const result = checkSequentialDelayRateLimit(
  //     domain,
  //     Date.now() / 1000, // Divide by 1000 to convert the current time in ms to seconds.
  //     domainState
  //   )

  //   // If the result indicates insufficient quota, return a failure.
  //   // Note that the database will not be updated.
  //   if (!result.accepted || !result.state) {
  //     return { sufficient: false, newState: domainStateRecord }
  //   }

  //   // Convert the result to a database record.
  //   const newState: DomainStateRecord = new DomainStateRecord(
  //     domainStateRecord[DOMAIN_STATE_COLUMNS.domainHash],
  //     result.state
  //   )

  //   // const newState: DomainStateRecord = {
  //   //   timer: result.state.timer,
  //   //   counter: result.state.counter,
  //   //   domainHash: domainStateRecord[DOMAINS_STATES_COLUMNS.domainHash],
  //   //   disabled: domainStateRecord[DOMAINS_STATES_COLUMNS.disabled],
  //   // }

  //   // Persist the updated domain quota to the database.
  //   // This will trigger an insert if this is the first update to the domain.
  //   await updateDomainStateRecord(domain, newState, trx, logger)

  //   return {
  //     sufficient: true,
  //     newState,
  //   }
  // }

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
    signature: string,
    domainState: DomainState,
    key: Key
  ) {
    response.set(KEY_VERSION_HEADER, key.version.toString()) // TODO(Alec)
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
    let keyVersion = Number(request.headers[KEY_VERSION_HEADER])
    if (Number.isNaN(keyVersion)) {
      logger.warn('Supplied keyVersion in request header is NaN')
      keyVersion = this.config.keystore.keys.domains.latest
    }

    // TODO(Alec)

    return true

    // const key: Key = {
    //   name: DefaultKeyName.DOMAINS,
    //   version: keyVersion,
    // }
  }

  // public nonceCheck(
  //   domainRequest: DomainRequest<Domain>,
  //   domainState: DomainStateRecord,
  //   logger: Logger
  // ): boolean {
  //   const nonce = domainRequest?.options?.nonce
  //   if (!nonce) {
  //     logger.info('Nonce is undefined')
  //     return false
  //   }
  //   let currentNonce = domainState[DOMAINS_STATES_COLUMNS.counter]
  //   if (!currentNonce) {
  //     logger.info('Counter is undefined')
  //     currentNonce = 0
  //   }
  //   return nonce.value >= currentNonce
  // }

  //   private nonceCheck(
  //     request: Request<{}, {}, DomainRestrictedSignatureRequest>,
  //     response: Response<DomainResponse<DomainRestrictedSignatureRequest>>,
  //     domainState: DomainStateRecord | null,
  //     logger: Logger
  //   ): boolean {
  //     if (!domainState) {
  //       domainState = DomainStateRecord.createEmptyDomainState(request.body.domain)
  //     }
  //     if (!this.authService.nonceCheck(request.body, domainState, logger)) {
  //       this.sendFailure(response, WarningMessage.UNAUTHENTICATED_USER, 401, this.endpoint, logger)
  //       return false
  //     }
  //     return true
  //   }
  // }
}
