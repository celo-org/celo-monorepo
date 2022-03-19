import {
  CombinerEndpoint,
  DisableDomainRequest,
  disableDomainRequestSchema,
  DisableDomainResponse,
  DisableDomainResponseSuccess,
  Domain,
  DomainSchema,
  ErrorMessage,
  getSignerEndpoint,
  SignerEndpoint,
  verifyDisableDomainRequestAuthenticity,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { OdisConfig, VERSION } from '../../config'
import { CombinerService, Session, SignerResponseWithStatus } from '../combiner.service'

interface DomainDisableResponseWithStatus extends SignerResponseWithStatus {
  url: string
  res: DisableDomainResponse
  status: number
}

export class DomainDisableService extends CombinerService<
  DisableDomainRequest,
  DisableDomainResponse
> {
  protected endpoint: CombinerEndpoint
  protected signerEndpoint: SignerEndpoint
  protected responses: DomainDisableResponseWithStatus[]

  public constructor(config: OdisConfig) {
    super(config)
    this.endpoint = CombinerEndpoint.DISABLE_DOMAIN
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
    this.responses = []
  }

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DisableDomainRequest> {
    return disableDomainRequestSchema(DomainSchema).is(request.body)
  }

  protected authenticate(request: Request<{}, {}, DisableDomainRequest<Domain>>): Promise<boolean> {
    return Promise.resolve(verifyDisableDomainRequestAuthenticity(request.body))
  }

  protected reqKeyHeaderCheck(_request: Request<{}, {}, DisableDomainRequest>): boolean {
    return true // does not require key header
  }

  protected async handleResponseOK(
    data: string,
    status: number,
    url: string,
    session: Session<DisableDomainRequest, DisableDomainResponse>
  ): Promise<void> {
    const res = JSON.parse(data)

    if (!res.success) {
      session.logger.error({ error: res.error, signer: url }, 'Signer responded with error')
      throw new Error(`Signer request to ${url}/${this.signerEndpoint} request failed`)
    }

    session.logger.info({ signer: url }, `Signer request successful`)
    this.responses.push({ url, res, status })

    if (this.responses.length >= this.threshold) {
      session.controller.abort()
    }
  }

  protected sendSuccessResponse(response: Response<DisableDomainResponseSuccess>, status: number) {
    response.status(status).json({
      success: true,
      version: VERSION,
    })
  }

  protected async combine(
    session: Session<DisableDomainRequest, DisableDomainResponse>
  ): Promise<void> {
    if (this.responses.length >= this.threshold) {
      // A
      session.response.json({ success: true, version: VERSION })
      return
    }

    this.sendFailureResponse(
      ErrorMessage.THRESHOLD_DISABLE_DOMAIN_FAILURE,
      session.getMajorityErrorCode() ?? 500, // B
      session
    )
  }
}
