import {
  CombinerEndpoint,
  DomainQuotaStatusRequest,
  DomainQuotaStatusResponse,
  DomainQuotaStatusResponseSuccess,
  ErrorMessage,
  getSignerEndpoint,
  KnownDomainState,
  SignerEndpoint,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { OdisConfig, VERSION } from '../../config'
import { CombinerService, SignerResponseWithStatus } from '../combiner.service'
import { IInputService } from '../input.interface'

interface DomainQuotaStatusResponseWithStatus extends SignerResponseWithStatus {
  url: string
  res: DomainQuotaStatusResponse
  status: number
}

export class DomainQuotaStatusService extends CombinerService {
  protected endpoint: CombinerEndpoint
  protected signerEndpoint: SignerEndpoint
  protected responses: DomainQuotaStatusResponseWithStatus[]

  public constructor(config: OdisConfig, protected inputService: IInputService) {
    super(config, inputService)
    this.endpoint = CombinerEndpoint.DOMAIN_QUOTA_STATUS
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
    this.responses = []
  }

  protected async handleResponseOK(
    _request: Request<{}, {}, DomainQuotaStatusRequest>,
    data: string,
    status: number,
    url: string
  ): Promise<void> {
    const res = JSON.parse(data)

    if (!res.success) {
      this.logger.warn({ signer: url, error: res.error }, 'Signer responded with error')
      throw new Error(res.error) // TODO(Alec): Can this part be factored out?
    }

    this.logger.info({ signer: url }, `Signer request successful`)
    this.responses.push({ url, res, status })
  }

  protected async combineSignerResponses(
    _request: Request<{}, {}, DomainQuotaStatusRequest>,
    response: Response<any>
  ): Promise<void> {
    if (this.responses.length >= this.threshold) {
      try {
        const domainQuotaStatus = this.findThresholdDomainState()
        response.json({
          success: true,
          status: domainQuotaStatus,
          version: VERSION,
        })
        return
      } catch (error) {
        this.logger.error({ error }, 'Error combining signer quota status responses')
      }
    }
    this.sendFailureResponse(
      response,
      ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE,
      this.getMajorityErrorCode() ?? 500
    )
  }

  protected sendSuccessResponse(
    response: Response<DomainQuotaStatusResponseSuccess>,
    quotaStatus: KnownDomainState,
    statusCode: number
  ) {
    response.status(statusCode).json({
      success: true,
      version: VERSION,
      status: quotaStatus,
    })
  }

  private findThresholdDomainState(): DomainState {
    const domainStates = this.responses.map(
      (s) => (s.res as DomainQuotaStatusResponseSuccess).status // TODO(Alec)
    )
    if (domainStates.length < this.threshold) {
      throw new Error('Insufficient number of signer responses')
    }

    const domainStatesEnabled = domainStates.filter((ds) => !ds.disabled)
    const numDisabled = domainStates.length - domainStatesEnabled.length

    if (numDisabled > 0 && numDisabled < domainStates.length) {
      this.logger.warn(WarningMessage.INCONSISTENT_SIGNER_DOMAIN_DISABLED_STATES)
    }

    if (this.signers.length - numDisabled < this.threshold) {
      return { timer: 0, counter: 0, disabled: true }
    }

    if (domainStatesEnabled.length < this.threshold) {
      throw new Error('Insufficient number of signer responses. Domain may be disabled')
    }

    const n = this.threshold - 1

    const domainStatesAscendingByCounter = domainStatesEnabled.sort((a, b) => a.counter - b.counter)
    const nthLeastRestrictiveByCounter = domainStatesAscendingByCounter[n]
    const thresholdCounter = nthLeastRestrictiveByCounter.counter

    // Client should submit requests with nonce === thresholdCounter

    const domainStatesWithThresholdCounter = domainStatesEnabled.filter(
      (ds) => ds.counter <= thresholdCounter
    )
    const domainStatesAscendingByTimer = domainStatesWithThresholdCounter.sort(
      (a, b) => a.timer - b.timer
    )
    const nthLeastRestrictiveByTimer = domainStatesAscendingByTimer[n]
    const thresholdTimer = nthLeastRestrictiveByTimer.timer

    const domainStatesAscendingByDate = domainStatesWithThresholdCounter.sort(
      (a, b) => a.date - b.date
    )
    const nthLeastRestrictiveByDate = domainStatesAscendingByDate[n]
    const thresholdDate = nthLeastRestrictiveByDate.date

    return {
      timer: thresholdTimer,
      counter: thresholdCounter,
      disabled: false,
      date: thresholdDate,
    }
  }
}
