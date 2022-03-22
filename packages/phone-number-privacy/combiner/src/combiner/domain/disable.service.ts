import {
  CombinerEndpoint,
  DisableDomainRequest,
  disableDomainRequestSchema,
  DisableDomainResponseFailure,
  DisableDomainResponseSchema,
  DisableDomainResponseSuccess,
  Domain,
  DomainSchema,
  ErrorMessage,
  ErrorType,
  getSignerEndpoint,
  send,
  SignerEndpoint,
  verifyDisableDomainRequestAuthenticity,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { OdisConfig, VERSION } from '../../config'
import { CombinerService } from '../combiner.service'
import { Session } from '../session'

export class DomainDisableService extends CombinerService<DisableDomainRequest> {
  readonly endpoint: CombinerEndpoint
  readonly signerEndpoint: SignerEndpoint

  public constructor(config: OdisConfig) {
    super(config)
    this.endpoint = CombinerEndpoint.DISABLE_DOMAIN
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
  }

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DisableDomainRequest> {
    return disableDomainRequestSchema(DomainSchema).is(request.body)
  }
  protected checkKeyVersionHeader(_request: Request<{}, {}, DisableDomainRequest>): boolean {
    return true // does not require request key header
  }
  protected authenticate(request: Request<{}, {}, DisableDomainRequest<Domain>>): Promise<boolean> {
    return Promise.resolve(verifyDisableDomainRequestAuthenticity(request.body))
  }

  protected async receiveSuccess(
    data: string,
    status: number,
    url: string,
    session: Session<DisableDomainRequest>
  ): Promise<void> {
    const res: unknown = JSON.parse(data)
    if (!DisableDomainResponseSchema.is(res)) {
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

    if (this.checkThresholdDisabled(session)) {
      session.controller.abort()
    }
  }

  protected async combine(session: Session<DisableDomainRequest>): Promise<void> {
    if (this.checkThresholdDisabled(session)) {
      return this.sendSuccess(200, session.response, session.logger)
    }

    this.sendFailure(
      ErrorMessage.THRESHOLD_DISABLE_DOMAIN_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session.response,
      session.logger
    )
  }

  protected sendSuccess(
    status: number,
    response: Response<DisableDomainResponseSuccess>,
    logger: Logger
  ) {
    send(
      response,
      {
        success: true,
        version: VERSION,
      },
      status,
      logger
    )
  }

  protected sendFailure(
    error: ErrorType,
    status: number,
    response: Response<DisableDomainResponseFailure>,
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

  private checkThresholdDisabled(session: Session<DisableDomainRequest>): boolean {
    // If we have received a threshold of responses return immediately.
    // With a t of n threshold, the domain is disabled as long as n-t+1 disable the domain.
    // When the threshold is greater than half the signers, t > n-t+1.
    // When that is the case, wait for a full threshold of responses before responding OK to add to the safety margin.
    return (
      session.responses.length >= Math.max(this.threshold, this.signers.length - this.threshold + 1)
    )
  }
}
