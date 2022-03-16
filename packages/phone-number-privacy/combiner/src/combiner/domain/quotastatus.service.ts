import {
  CombinerEndpoint,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  DomainQuotaStatusResponse,
  domainQuotaStatusResponseSchema,
  DomainQuotaStatusResponseSuccess,
  DomainSchema,
  DomainState,
  ErrorMessage,
  getSignerEndpoint,
  SignerEndpoint,
  verifyDomainQuotaStatusRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { OdisConfig, VERSION } from '../../config'
import { CombinerService, SignerResponseWithStatus } from '../combiner.service'

interface DomainQuotaStatusResponseWithStatus extends SignerResponseWithStatus {
  url: string
  res: DomainQuotaStatusResponse
  status: number
}

export class DomainQuotaStatusService extends CombinerService {
  protected endpoint: CombinerEndpoint
  protected signerEndpoint: SignerEndpoint
  protected responses: DomainQuotaStatusResponseWithStatus[]

  public constructor(config: OdisConfig) {
    super(config)
    this.endpoint = CombinerEndpoint.DOMAIN_QUOTA_STATUS
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
    this.responses = []
  }

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainQuotaStatusRequest> {
    return domainQuotaStatusRequestSchema(DomainSchema).is(request.body)
  }

  protected authenticate(request: Request<{}, {}, DomainQuotaStatusRequest>): Promise<boolean> {
    return Promise.resolve(verifyDomainQuotaStatusRequestAuthenticity(request.body))
  }

  protected async handleResponseOK(
    _request: Request<{}, {}, DomainQuotaStatusRequest>,
    data: string,
    status: number,
    url: string
  ): Promise<void> {
    const res: unknown = JSON.parse(data)

    if (!domainQuotaStatusRequestSchema(DomainSchema).is(res)) {
      this.logger.error({ data: data, signer: url }, 'Signer responded with malformed response')
      throw new Error(
        `Signer request to ${url}/${this.signerEndpoint} request returned malformed response`
      )
    }

    // In this function HTTP response status is assumed 200. Error if the response is failed.
    if (!res.success) {
      this.logger.error(
        { error: res.error, signer: url },
        'Signer responded with error and 200 status'
      )
      throw new Error(
        `Signer request to ${url}/${this.signerEndpoint} request failed with 200 status`
      )
    }

    this.logger.info({ signer: url }, `Signer request successful`)
    this.responses.push({ url, res, status })
  }

  protected async combineSignerResponses(
    _request: Request<{}, {}, DomainQuotaStatusRequest>,
    response: Response<DomainQuotaStatusResponse>
  ): Promise<void> {
    if (this.responses.length >= this.threshold) {
      try {
        const domainQuotaStatus = this.findThresholdDomainState()
        response.status(200).json({
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
    quotaStatus: DomainState,
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
      return { timer: 0, counter: 0, disabled: true, date: 0 }
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
