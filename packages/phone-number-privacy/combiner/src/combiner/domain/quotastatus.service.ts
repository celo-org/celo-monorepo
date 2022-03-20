import {
  CombinerEndpoint,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  DomainQuotaStatusResponseSuccess,
  DomainRestrictedSignatureRequest,
  DomainSchema,
  DomainState,
  ErrorMessage,
  ErrorType,
  getSignerEndpoint,
  respondWithError,
  SignerEndpoint,
  verifyDomainQuotaStatusRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { OdisConfig, VERSION } from '../../config'
import { CombinerService, Session } from '../combiner.service'

export class DomainQuotaStatusService extends CombinerService<DomainQuotaStatusRequest> {
  readonly endpoint: CombinerEndpoint
  readonly signerEndpoint: SignerEndpoint

  public constructor(config: OdisConfig) {
    super(config)
    this.endpoint = CombinerEndpoint.DOMAIN_QUOTA_STATUS
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
  }

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainQuotaStatusRequest> {
    return domainQuotaStatusRequestSchema(DomainSchema).is(request.body)
  }

  protected authenticate(request: Request<{}, {}, DomainQuotaStatusRequest>): Promise<boolean> {
    return Promise.resolve(verifyDomainQuotaStatusRequestAuthenticity(request.body))
  }

  protected reqKeyHeaderCheck(_request: Request<{}, {}, DomainQuotaStatusRequest>): boolean {
    return true // does not require key header
  }

  protected async handleResponseOK(
    data: string,
    status: number,
    url: string,
    session: Session<DomainQuotaStatusRequest>
  ): Promise<void> {
    const res = JSON.parse(data)

    if (!res.success) {
      session.logger.warn({ signer: url, error: res.error }, 'Signer responded with error')
      throw new Error(res.error) // TODO(Alec): Can this part be factored out?
    }

    session.logger.info({ signer: url }, `Signer request successful`)
    session.responses.push({ url, res, status })
  }

  protected async combine(session: Session<DomainQuotaStatusRequest>): Promise<void> {
    if (session.responses.length >= this.threshold) {
      // A
      try {
        const domainQuotaStatus = findThresholdDomainState(session)
        session.response.json({
          success: true,
          status: domainQuotaStatus,
          version: VERSION,
        })
        return
      } catch (error) {
        session.logger.error({ error }, 'Error combining signer quota status responses')
      }
    }
    this.sendFailureResponse(
      ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE,
      session.getMajorityErrorCode() ?? 500, // B
      session
    )
  }

  protected sendSuccessResponse(
    res: DomainQuotaStatusResponseSuccess,
    status: number,
    session: Session<DomainQuotaStatusRequest>
  ) {
    session.response.status(status).json(res)
  }

  protected sendFailureResponse(
    error: ErrorType,
    status: number,
    session: Session<DomainQuotaStatusRequest>
  ) {
    // TODO(Alec)
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
}

// TODO(Alec): Move this elsewhere
export function findThresholdDomainState<
  R extends DomainRestrictedSignatureRequest | DomainQuotaStatusRequest
>(session: Session<R>): DomainState {
  const domainStates = session.responses
    .map((signerResponse) => ('status' in signerResponse.res ? signerResponse.res.status : null))
    .filter((state) => state ?? false) as DomainState[]
  const threshold = session.service.threshold
  if (domainStates.length < threshold) {
    throw new Error('Insufficient number of signer responses')
  }

  const domainStatesEnabled = domainStates.filter((ds) => !ds.disabled)
  const numDisabled = domainStates.length - domainStatesEnabled.length

  if (numDisabled > 0 && numDisabled < domainStates.length) {
    session.logger.warn(WarningMessage.INCONSISTENT_SIGNER_DOMAIN_DISABLED_STATES)
  }

  if (session.service.signers.length - numDisabled < threshold) {
    return { timer: 0, counter: 0, disabled: true, date: 0 }
  }

  if (domainStatesEnabled.length < threshold) {
    throw new Error('Insufficient number of signer responses. Domain may be disabled')
  }

  const n = threshold - 1

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
