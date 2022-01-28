import { ErrorMessage, SignerEndpoint } from '@celo/phone-number-privacy-common'
import { Response } from 'express'
import { respondWithError } from '../../common/error-utils'
import { VERSION } from '../../config'
import { CombinerService } from '../combiner.service'

export class DomainDisableService extends CombinerService {
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
