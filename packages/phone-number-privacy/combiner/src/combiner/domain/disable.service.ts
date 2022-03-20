import {
  CombinerEndpoint,
  DisableDomainRequest,
  disableDomainRequestSchema,
  DisableDomainResponseSchema,
  Domain,
  DomainSchema,
  ErrorMessage,
  getSignerEndpoint,
  SignerEndpoint,
  verifyDisableDomainRequestAuthenticity,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
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
    session: Session<DisableDomainRequest>
  ): Promise<void> {
    const res: unknown = JSON.parse(data)

    if (!DisableDomainResponseSchema.is(res)) {
      session.logger.error({ data, signer: url }, 'Signer responded with malformed response')
      throw new Error(
        `Signer request to ${url}/${this.signerEndpoint} request returned malformed response`
      )
    }

    // In this function HTTP response status is assumed 200. Error if the response is failed.
    if (!res.success) {
      session.logger.error(
        { error: res.error, signer: url },
        'Signer responded with error and 200 status'
      )
      throw new Error(
        `Signer request to ${url}/${this.signerEndpoint} request failed with 200 status`
      )
    }

    session.logger.info({ signer: url }, `Signer request successful`)
    session.responses.push({ url, res, status })

    // If we have received a threshold of responses return immediately.
    // With a t of n threshold, the domain is disabled as long as n-t+1 disable the domain. When the
    // threshold is greater than half the signers, t > n-t+1. When that is the case, wait for a
    // full threshold of responses before responding OK to add to the safety margin.
    // TODO(Alec)(Next): Review this
    // if (session.responses.length >= this.threshold) {
    //   session.controller.abort()
    // }
    if (
      session.responses.length >= Math.max(this.threshold, this.signers.length - this.threshold + 1)
    ) {
      session.controller.abort()
    }
  }

  protected async combine(session: Session<DisableDomainRequest>): Promise<void> {
    if (session.responses.length >= this.threshold) {
      return this.sendSuccessResponse(
        {
          success: true,
          version: VERSION,
        },
        200,
        session
      )
    }

    this.sendFailureResponse(
      ErrorMessage.THRESHOLD_DISABLE_DOMAIN_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session
    )
  }
}
