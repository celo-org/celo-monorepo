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
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { computeBlindedSignature } from '../../bls/bls-cryptography-client'
import { Counters } from '../../common/metrics'
import { getVersion } from '../../config'
import { getDatabase } from '../../database/database'
import { DomainStateRecord } from '../../database/models/domainState'
import { getDomainStateWithLock } from '../../database/wrappers/domainState'
import { getKeyProvider } from '../../key-management/key-provider'
import { DefaultKeyName, Key } from '../../key-management/key-provider-base'
import { Session } from '../session'
import { Signer } from '../signer'

export class DomainSign extends Signer<DomainRestrictedSignatureRequest> {
  readonly endpoint = SignerEndpoint.DOMAIN_SIGN
  readonly combinerEndpoint = getCombinerEndpoint(this.endpoint)

  protected async _handle(session: Session<DomainRestrictedSignatureRequest>): Promise<void> {
    const domain = session.request.body.domain
    const blindedMessage = session.request.body.blindedMessage

    session.logger.info('Processing request to get domain signature ', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })

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
      let signature: string | undefined
      await getDatabase().transaction(async (trx) => {
        // Get the current domain state record, or use an empty record one does not exist.
        const domainState =
          (await getDomainStateWithLock(domain, trx, session.logger)) ??
          DomainStateRecord.createEmptyDomainState(domain)

        const quotaStatus = await this.quotaService.checkAndUpdateQuota(
          domain,
          domainState,
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
            quotaStatus
          )
        }

        // Compute the signature inside the transaction such that it will rollback on error.
        const keyProvider = getKeyProvider()
        const privateKey = await keyProvider.getPrivateKeyOrFetchFromStore(key)
        signature = computeBlindedSignature(blindedMessage, privateKey, session.logger)
      })

      // TODO(victor): Checking the existance of the sigature to determine whether this operation
      // succeeded is a little clunky. Refactor this to improve the flow.
      if (signature) {
        this.sendSuccess(200, session.response, session.logger, signature, quotaStatus)
        // session.response
        //   .status(200)
        //   .set(KEY_VERSION_HEADER, key.version.toString()) // TODO(Alec)(Next)
        //   .json(signMessageResponseSuccess)
      }
    } catch (err) {
      session.logger.error('Failed to get signature for a domain')
      session.logger.error(err)
      this.sendFailure(ErrorMessage.UNKNOWN_ERROR, 500, session.response, session.logger)
    }
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
    signature: string,
    domainState: DomainState
  ) {
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

// // tslint:disable-next-line: max-classes-per-file
// export class DomainQuotaService implements IDomainQuotaService {
//     public async checkAndUpdateQuota(
//       domain: Domain,
//       domainState: DomainStateRecord,
//       trx: Transaction<DomainStateRecord>,
//       logger: Logger
//     ): Promise<{ sufficient: boolean; newState: DomainStateRecord }> {
//       if (isSequentialDelayDomain(domain)) {
//         return this.handleSequentialDelayDomain(domain, domainState, trx, logger)
//       } else {
//         throw new Error(ErrorMessage.UNSUPPORTED_DOMAIN)
//       }
//     }

//     private async handleSequentialDelayDomain(
//       domain: Domain,
//       domainStateRecord: DomainStateRecord,
//       trx: Transaction<DomainStateRecord>,
//       logger: Logger
//     ) {
//       const result = checkSequentialDelayRateLimit(
//         domain,
//         // Divide by 1000 to convert the current time in ms to seconds.
//         Date.now() / 1000,
//         toSequentialDelayDomainState(domainStateRecord)
//       )

//       // If the result indicates insufficient quota, return a failure.
//       // Note that the database will not be updated.
//       if (!result.accepted || !result.state) {
//         return { sufficient: false, newState: domainState }
//       }

//       // Convert the result to a database record.
//       const newState: DomainStateRecord = {
//         timer: result.state.timer,
//         counter: result.state.counter,
//         domainHash: domainState[DOMAINS_STATES_COLUMNS.domainHash],
//         disabled: domainState[DOMAINS_STATES_COLUMNS.disabled],
//       }

//       // Persist the updated domain quota to the database.
//       // This will trigger an insert if this is the first update to the domain.
//       await updateDomainState(domain, newState, trx, logger)

//       return {
//         sufficient: true,
//         newState,
//       }
//     }
