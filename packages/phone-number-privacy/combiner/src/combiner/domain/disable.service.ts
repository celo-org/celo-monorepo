import {
  CombinerEndpoint,
  DisableDomainResponse,
  ErrorMessage,
  getSignerEndpoint,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import AbortController from 'abort-controller'
import { Response } from 'express'
import { respondWithError } from '../../common/error-utils'
import { OdisConfig, VERSION } from '../../config'
import { CombinerService, SignerResponseWithStatus } from '../combiner.service'
import { ICombinerInputService } from '../input.interface'

interface DomainDisableResponseWithStatus extends SignerResponseWithStatus {
  url: string
  res: DisableDomainResponse
  status: number
}

export class DomainDisableService extends CombinerService {
  protected endpoint: CombinerEndpoint
  protected signerEndpoint: SignerEndpoint
  protected responses: DomainDisableResponseWithStatus[]

  public constructor(_config: OdisConfig, protected inputService: ICombinerInputService) {
    super(_config, inputService)
    this.endpoint = CombinerEndpoint.DISABLE_DOMAIN
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
    this.responses = []
  }

  protected async handleSuccessResponse(
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

    if (this.signerEndpoint === SignerEndpoint.DISABLE_DOMAIN) {
      if (this.responses.length >= this.threshold) {
        controller.abort()
      }
    }
  }

  protected async combineSignerResponses(response: Response<any>): Promise<void> {
    if (this.responses.length >= this.threshold) {
      response.json({ success: true, version: VERSION })
      return
    }

    respondWithError(
      response,
      this.getMajorityErrorCode() ?? 500,
      ErrorMessage.THRESHOLD_DISABLE_DOMAIN_FAILURE,
      this.logger
    )
  }
}
