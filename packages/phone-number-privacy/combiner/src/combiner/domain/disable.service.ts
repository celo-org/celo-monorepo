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
import AbortController from 'abort-controller'
import { Request, Response } from 'express'
import { OdisConfig, VERSION } from '../../config'
import { CombinerService, SignerResponseWithStatus } from '../combiner.service'

interface DomainDisableResponseWithStatus extends SignerResponseWithStatus {
  url: string
  res: DisableDomainResponse
  status: number
}

export class DomainDisableService extends CombinerService {
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

  protected async handleResponseOK(
    _request: Request<{}, {}, DisableDomainRequest>,
    data: string,
    status: number,
    url: string,
    controller: AbortController
  ): Promise<void> {
    const res = JSON.parse(data)

    if (!res.success) {
      this.logger.error({ error: res.error, signer: url }, 'Signer responded with error')
      throw new Error(`Signer request to ${url}/${this.signerEndpoint} request failed`)
    }

    this.logger.info({ signer: url }, `Signer request successful`)
    this.responses.push({ url, res, status })

    if (this.responses.length >= this.threshold) {
      controller.abort()
    }
  }

  protected sendSuccessResponse(response: Response<DisableDomainResponseSuccess>, status: number) {
    response.status(status).json({
      success: true,
      version: VERSION,
    })
  }

  protected async combineSignerResponses(
    _request: Request<{}, {}, DisableDomainRequest>,
    response: Response<any>
  ): Promise<void> {
    if (this.responses.length >= this.threshold) {
      response.json({ success: true, version: VERSION })
      return
    }

    this.sendFailureResponse(
      response,
      ErrorMessage.THRESHOLD_DISABLE_DOMAIN_FAILURE,
      this.getMajorityErrorCode() ?? 500
    )
  }
}
