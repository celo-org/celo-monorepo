import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  DomainRestrictedSignatureResponse,
  DomainRestrictedSignatureResponseFailure,
  ErrorType,
  FailureResponse,
  getSignerEndpoint,
  respondWithError,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import { Response } from 'express'
import { logger } from 'firebase-functions/v1'
import { OdisConfig, VERSION } from '../../config'
import { SignerResponseWithStatus } from '../combiner.service'
import { IInputService } from '../input.interface'
import { SignService } from '../sign.service'

interface DomainSignResponseWithStatus extends SignerResponseWithStatus {
  url: string
  res: DomainRestrictedSignatureResponse
  status: number
}

export class DomainSignService extends SignService {
  protected endpoint: CombinerEndpoint
  protected signerEndpoint: SignerEndpoint
  protected responses: DomainSignResponseWithStatus[]

  public constructor(config: OdisConfig, protected inputService: IInputService) {
    super(config, inputService)
    this.endpoint = CombinerEndpoint.DOMAIN_SIGN
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
    this.responses = []
  }

  protected parseSignature(
    res: DomainRestrictedSignatureResponse,
    signerUrl: string
  ): string | undefined {
    if (!res.success) {
      this.logger.error(
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
    response: Response<FailureResponse>,
    error: ErrorType,
    status: number
  ) {
    respondWithError(
      response,
      {
        success: false,
        version: VERSION,
        error,
        retryAfter: this.getRetryAfter(),
        date: this.getDate(),
      },
      status,
      this.logger
    )
  }

  protected parseBlindedMessage(req: DomainRestrictedSignatureRequest): string {
    return req.blindedMessage
  }

  protected logResponseDiscrepancies(): void {
    // TODO(Alec)
    throw new Error('Method not implemented.')
  }

  private getRetryAfter(): number {
    try {
      return this.responses
        .filter((response) => !response.res.success && response.res.retryAfter > 0)
        .map((response) => response.res as DomainRestrictedSignatureResponseFailure)
        .sort((a, b) => a.retryAfter - b.retryAfter)[this.threshold - 1].retryAfter
    } catch (error) {
      logger.error({ error }, 'Error getting threshold response retryAfter value')
      return -1
    }
  }

  private getDate(): number {
    try {
      return this.responses
        .filter((response) => !response.res.success && response.res.date > 0)
        .map((response) => response.res as DomainRestrictedSignatureResponseFailure)
        .sort((a, b) => a.date - b.date)[this.threshold - 1].date
    } catch (error) {
      logger.error({ error }, 'Error getting threshold response date value')
      return -1
    }
  }
}
