import {
  DomainQuotaStatusResponseSuccess,
  ErrorMessage,
  KnownDomainState,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import { Response } from 'express'
import { respondWithError } from '../../common/error-utils'
import { VERSION } from '../../config'
import { CombinerService } from '../combiner.service'

export class DomainQuotaStatusService extends CombinerService {
  protected async handleSuccessResponse(
    data: string,
    status: number,
    url: string,
    controller: AbortController
  ): Promise<void> {
    const res = JSON.parse(data)

    if (!res.success) {
      this.logger.error(
        {
          error: res.error,
          signer: url,
        },
        'Signer responded with error'
      )
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
      const domainQuotaStatus = this.findThresholdDomainState()
      response.json({ success: true, status: domainQuotaStatus, version: VERSION })
      return
    }

    respondWithError(
      response,
      this.getMajorityErrorCode() ?? 500,
      ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE,
      this.logger
    )
  }

  private findThresholdDomainState(): KnownDomainState {
    let domainStates = this.responses.map((s) => (s.res as DomainQuotaStatusResponseSuccess).status)
    if (domainStates.length < this.threshold) {
      // TODO(Alec)(Next): Think through consequences of throwing here
      throw new Error('Insufficient number of signer responses') // TODO(Alec): better error message
    }

    const numDisabled = domainStates.filter((ds) => ds.disabled).length

    if (numDisabled && numDisabled < domainStates.length) {
      this.logger.warn('Inconsistent domain disabled state across signers') // TODO(Alec)
    }

    if (this.signers.length - numDisabled < this.threshold) {
      return {
        timer: 0,
        counter: 0,
        disabled: true,
      }
    }

    if (domainStates.length - numDisabled < this.threshold) {
      throw new Error('Insufficient number of signer responses. Domain may be disabled') // TODO(Alec): better error message
    }

    domainStates = domainStates.filter((ds) => !ds.disabled)

    const domainStatesAscendingByCounter = domainStates.sort((a, b) => a.counter - b.counter)
    const nthLeastRestrictiveByCounter = domainStatesAscendingByCounter[this.threshold - 1]
    const thresholdCounter = nthLeastRestrictiveByCounter.counter

    // Client should submit requests with nonce == thresholdCounter

    const domainStatesWithThresholdCounter = domainStates.filter(
      (ds) => ds.counter <= thresholdCounter
    )
    const domainStatesAscendingByTimer = domainStatesWithThresholdCounter.sort(
      (a, b) => a.timer - b.timer
    )
    const nthLeastRestrictiveByTimer = domainStatesAscendingByTimer[this.threshold - 1]
    const thresholdTimer = nthLeastRestrictiveByTimer.timer

    return {
      timer: thresholdTimer,
      counter: thresholdCounter,
      disabled: false,
    }
  }
}
