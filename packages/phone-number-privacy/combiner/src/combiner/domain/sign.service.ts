import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  DomainRestrictedSignatureResponse,
  DomainSchema,
  ErrorType,
  getSignerEndpoint,
  respondWithError,
  SignerEndpoint,
  verifyDomainRestrictedSignatureRequestAuthenticity,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { OdisConfig, VERSION } from '../../config'
import { Session, SignerResponseWithStatus } from '../combiner.service'
import { SignService } from '../sign.service'

interface DomainSignResponseWithStatus extends SignerResponseWithStatus {
  url: string
  res: DomainRestrictedSignatureResponse
  status: number
}

export class DomainSignService extends SignService<
  DomainRestrictedSignatureRequest,
  DomainRestrictedSignatureResponse
> {
  protected endpoint: CombinerEndpoint
  protected signerEndpoint: SignerEndpoint
  protected responses: DomainSignResponseWithStatus[]

  public constructor(config: OdisConfig) {
    super(config)
    this.endpoint = CombinerEndpoint.DOMAIN_SIGN
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
    this.responses = []
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

  protected parseSignature(
    res: DomainRestrictedSignatureResponse,
    signerUrl: string,
    session: Session<DomainRestrictedSignatureRequest, DomainRestrictedSignatureResponse>
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

  protected sendFailureResponse(
    error: ErrorType,
    status: number,
    session: Session<DomainRestrictedSignatureRequest, DomainRestrictedSignatureResponse>
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

  protected logResponseDiscrepancies(): void {
    // TODO(Alec)
    throw new Error('Method not implemented.')
  }

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
