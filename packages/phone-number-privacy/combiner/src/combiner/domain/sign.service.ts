import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  DomainRestrictedSignatureResponse,
  DomainRestrictedSignatureResponseSuccess,
  DomainSchema,
  ErrorType,
  getSignerEndpoint,
  respondWithError,
  SignerEndpoint,
  verifyDomainRestrictedSignatureRequestAuthenticity,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { OdisConfig, VERSION } from '../../config'
import { Session } from '../combiner.service'
import { SignService } from '../sign.service'
import { findThresholdDomainState } from './quotastatus.service'

export class DomainSignService extends SignService<DomainRestrictedSignatureRequest> {
  readonly endpoint: CombinerEndpoint
  readonly signerEndpoint: SignerEndpoint

  public constructor(config: OdisConfig) {
    super(config)
    this.endpoint = CombinerEndpoint.DOMAIN_SIGN
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
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

  protected async combine(session: Session<DomainRestrictedSignatureRequest>): Promise<void> {
    this.logResponseDiscrepancies(session)

    if (session.blsCryptoClient.hasSufficientSignatures()) {
      // C
      try {
        const combinedSignature = await session.blsCryptoClient.combinePartialBlindedSignatures(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )
        // TODO(Alec): return other fields?
        return this.sendSuccessResponse(
          {
            success: true,
            version: VERSION,
            signature: combinedSignature,
            status: findThresholdDomainState(session),
          },
          200,
          session
        )
      } catch {
        // May fail upon combining signatures if too many sigs are invalid
        // Fallback to handleMissingSignatures
      }
    }

    this.handleMissingSignatures(session) // B
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

  protected sendSuccessResponse(
    res: DomainRestrictedSignatureResponseSuccess,
    status: number,
    session: Session<DomainRestrictedSignatureRequest>
  ) {
    session.response.status(status).json(res)
  }

  protected sendFailureResponse(
    error: ErrorType,
    status: number,
    session: Session<DomainRestrictedSignatureRequest>
  ) {
    respondWithError(
      session.response,
      {
        success: false,
        version: VERSION,
        error,
      },
      status,
      session.logger
    )
  }

  protected parseBlindedMessage(req: DomainRestrictedSignatureRequest): string {
    return req.blindedMessage
  }

  protected logResponseDiscrepancies(_session: Session<DomainRestrictedSignatureRequest>): void {
    // TODO(Alec)
    throw new Error('Method not implemented.')
  }

  // TODO(Alec)
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
