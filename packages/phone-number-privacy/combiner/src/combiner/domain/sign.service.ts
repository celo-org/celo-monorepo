import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  DomainRestrictedSignatureResponse,
  DomainRestrictedSignatureResponseFailure,
  domainRestrictedSignatureResponseSchema,
  DomainRestrictedSignatureResponseSuccess,
  DomainSchema,
  DomainState,
  ErrorType,
  getSignerEndpoint,
  send,
  SequentialDelayDomainStateSchema,
  SignerEndpoint,
  verifyDomainRestrictedSignatureRequestAuthenticity,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { VERSION } from '../../config'
import { Session } from '../session'
import { SignService } from '../sign.service'
import { findThresholdDomainState } from './quotastatus.service'

export class DomainSignService extends SignService<DomainRestrictedSignatureRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.DOMAIN_SIGN
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(this.endpoint)

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainRestrictedSignatureRequest> {
    return domainRestrictedSignatureRequestSchema(DomainSchema).is(request.body)
  }

  protected authenticate(
    request: Request<{}, {}, DomainRestrictedSignatureRequest>
  ): Promise<boolean> {
    // Note that signing requests may include a nonce for replay protection that will be checked by
    // the signer, but is not checked here. As a result, requests that pass the authentication check
    // here may still fail when sent to the signer.
    return Promise.resolve(verifyDomainRestrictedSignatureRequestAuthenticity(request.body))
  }

  protected async combine(session: Session<DomainRestrictedSignatureRequest>): Promise<void> {
    this.logResponseDiscrepancies(session)

    if (session.blsCryptoClient.hasSufficientSignatures()) {
      try {
        const combinedSignature = await session.blsCryptoClient.combinePartialBlindedSignatures(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )
        // TODO(Alec)(Next)(responding): return other fields?
        return this.sendSuccess(
          200,
          session.response,
          session.logger,
          combinedSignature,
          findThresholdDomainState(session)
        )
      } catch {
        // May fail upon combining signatures if too many sigs are invalid
        // Fallback to handleMissingSignatures
      }
    }

    this.handleMissingSignatures(session)
  }

  protected sendSuccess(
    status: number,
    response: Response<DomainRestrictedSignatureResponseSuccess>,
    logger: Logger,
    combinedSignature: string,
    domainState: DomainState
  ) {
    send(
      response,
      {
        success: true,
        version: VERSION,
        signature: combinedSignature,
        status: domainState,
      },
      status,
      logger
    )
  }

  protected sendFailure(
    error: ErrorType,
    status: number,
    response: Response<DomainRestrictedSignatureResponseFailure>,
    logger: Logger,
    domainState: DomainState
  ) {
    send(
      response,
      {
        success: false,
        version: VERSION,
        error,
        status: domainState,
      },
      status,
      logger
    )
  }

  protected validateSignerResponse(
    data: string,
    url: string,
    session: Session<DomainRestrictedSignatureRequest>
  ): DomainRestrictedSignatureResponse {
    const res: unknown = JSON.parse(data)
    if (!domainRestrictedSignatureResponseSchema(SequentialDelayDomainStateSchema).is(res)) {
      // TODO(Alec): add error type for this
      const msg = `Signer request to ${url}/${this.signerEndpoint} returned malformed response`
      session.logger.error({ data, signer: url }, msg)
      throw new Error(msg)
    }
    return res
  }

  protected parseSignature(
    res: DomainRestrictedSignatureResponse,
    signerUrl: string,
    session: Session<DomainRestrictedSignatureRequest>
  ): string | undefined {
    if (!res.success) {
      session.logger.error(
        {
          error: res.error,
          signer: signerUrl,
        },
        'Signer responded with error' // TODO(Alec)
      )
      return undefined
    }
    return res.signature
  }

  protected parseBlindedMessage(req: DomainRestrictedSignatureRequest): string {
    return req.blindedMessage
  }

  protected logResponseDiscrepancies(_session: Session<DomainRestrictedSignatureRequest>): void {
    // TODO(Alec)
    throw new Error('Method not implemented.')
  }

  // TODO(Alec)(Next)
  // private getRetryAfter(): number {
  //   try {
  //     return this.responses
  //       .filter((response) => !response.res.success && response.res.retryAfter > 0)
  //       .map((response) => response.res as DomainRestrictedSignatureResponseFailure)
  //       .sort((a, b) => a.retryAfter - b.retryAfter)[this.threshold - 1].retryAfter
  //   } catch (error) {
  //     logger.error({ error }, 'Error getting threshold response retryAfter value')
  //     return -1
  //   }
  // }

  // private getDate(): number {
  //   try {
  //     return this.responses
  //       .filter((response) => !response.res.success && response.res.date > 0)
  //       .map((response) => response.res as DomainRestrictedSignatureResponseFailure)
  //       .sort((a, b) => a.date - b.date)[this.threshold - 1].date
  //   } catch (error) {
  //     logger.error({ error }, 'Error getting threshold response date value')
  //     return -1
  //   }
  // }
}
