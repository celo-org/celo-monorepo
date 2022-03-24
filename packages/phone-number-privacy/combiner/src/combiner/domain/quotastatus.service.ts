import {
  CombinerEndpoint,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  DomainQuotaStatusResponseFailure,
  domainQuotaStatusResponseSchema,
  DomainQuotaStatusResponseSuccess,
  DomainRestrictedSignatureRequest,
  DomainSchema,
  DomainState,
  ErrorMessage,
  ErrorType,
  getSignerEndpoint,
  send,
  SequentialDelayDomainStateSchema,
  SignerEndpoint,
  verifyDomainQuotaStatusRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { VERSION } from '../../config'
import { CombinerService } from '../combiner.service'
import { Session } from '../session'

export class DomainQuotaStatusService extends CombinerService<DomainQuotaStatusRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.DOMAIN_QUOTA_STATUS
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(CombinerEndpoint.DOMAIN_QUOTA_STATUS)

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainQuotaStatusRequest> {
    return domainQuotaStatusRequestSchema(DomainSchema).is(request.body)
  }
  protected checkKeyVersionHeader(_request: Request<{}, {}, DomainQuotaStatusRequest>): boolean {
    return true // does not require key version header
  }
  protected authenticate(request: Request<{}, {}, DomainQuotaStatusRequest>): Promise<boolean> {
    return Promise.resolve(verifyDomainQuotaStatusRequestAuthenticity(request.body))
  }

  protected async receiveSuccess(
    data: string,
    status: number,
    url: string,
    session: Session<DomainQuotaStatusRequest>
  ): Promise<void> {
    const res: unknown = JSON.parse(data)
    if (!domainQuotaStatusResponseSchema(SequentialDelayDomainStateSchema).is(res)) {
      const msg = `Signer request to ${url}/${this.signerEndpoint} returned malformed response`
      session.logger.error({ data, signer: url }, msg)
      throw new Error(msg)
    }
    // In this function HTTP response status is assumed 200. Error if the response is failed.
    if (!res.success) {
      const msg = `Signer request to ${url}/${this.signerEndpoint} failed with 200 status`
      session.logger.error({ error: res.error, signer: url }, msg)
      throw new Error(msg)
    }
    session.logger.info({ signer: url }, `Signer request successful`)
    session.responses.push({ url, res, status })
  }

  protected async combine(session: Session<DomainQuotaStatusRequest>): Promise<void> {
    if (session.responses.length >= this.threshold) {
      try {
        const domainQuotaStatus = findThresholdDomainState(session)
        this.sendSuccess(200, session.response, session.logger, domainQuotaStatus)
        return
      } catch (error) {
        session.logger.error({ error }, 'Error combining signer quota status responses')
      }
    }
    this.sendFailure(
      ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session.response,
      session.logger
    )
  }

  protected sendSuccess(
    status: number,
    response: Response<DomainQuotaStatusResponseSuccess>,
    logger: Logger,
    domainState: DomainState
  ) {
    send(
      response,
      {
        success: true,
        version: VERSION,
        status: domainState,
      },
      status,
      logger
    )
  }

  protected sendFailure(
    error: ErrorType,
    status: number,
    response: Response<DomainQuotaStatusResponseFailure>,
    logger: Logger
  ) {
    send(
      response,
      {
        success: false,
        version: VERSION,
        error,
      },
      status,
      logger
    )
  }
}

// TODO(Alec): Move this elsewhere (consider near sequential delay code)
export function findThresholdDomainState<
  R extends DomainRestrictedSignatureRequest | DomainQuotaStatusRequest
>(session: Session<R>): DomainState {
  // Get the domain status from the responses, filtering out responses that don't have the status.
  const domainStates = session.responses
    .map((signerResponse) => ('status' in signerResponse.res ? signerResponse.res.status : null))
    .filter((state) => state ?? false) as DomainState[]
  const threshold = session.service.threshold
  if (domainStates.length < threshold) {
    throw new Error('Insufficient number of signer responses')
  }

  // Check whether the domain is disabled, either by all signers or by some.
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

  // Set n to last signer index in a quorum of signers are sorted from least to most restrictive.
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
