import { DisableDomainRequest, ErrorMessage } from '@celo/phone-number-privacy-common'
import { Response as FetchResponse } from 'node-fetch'
import { OdisConfig } from '../../config'
import { CombineAbstract } from '../combine.abstract'
import { IOAbstract } from '../io.abstract'
import { Session } from '../session'

export class DomainDisableAction extends CombineAbstract<DisableDomainRequest> {
  constructor(readonly config: OdisConfig, readonly io: IOAbstract<DisableDomainRequest>) {
    super(config, io)
  }

  async combine(session: Session<DisableDomainRequest>): Promise<void> {
    if (this.checkThresholdDisabled(session)) {
      return this.io.sendSuccess(200, session.response, session.logger)
    }

    this.io.sendFailure(
      ErrorMessage.THRESHOLD_DISABLE_DOMAIN_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session.response,
      session.logger
    )
  }

  protected async receiveSuccess(
    signerResponse: FetchResponse,
    url: string,
    session: Session<DisableDomainRequest>
  ): Promise<void> {
    const status: number = signerResponse.status
    const data: string = await signerResponse.text()
    const res = this.io.validateSignerResponse(data, url, session)

    // In this function HTTP response status is assumed 200. Error if the response is failed.
    if (!res.success) {
      const msg = `Signer request to ${url + this.io.signerEndpoint} failed with 200 status` // TODO(Alec)
      session.logger.error({ error: res.error, signer: url }, msg)
      throw new Error(msg)
    }

    session.logger.info({ signer: url }, `Signer request successful`)
    session.responses.push({ url, res, status })

    if (this.checkThresholdDisabled(session)) {
      session.controller.abort()
    }
  }

  private checkThresholdDisabled(session: Session<DisableDomainRequest>): boolean {
    // If we have received a threshold of responses return immediately.
    // With a t of n threshold, the domain is disabled as long as n-t+1 disable the domain.
    // When the threshold is greater than half the signers, t > n-t+1.
    // When that is the case, wait for a full threshold of responses before responding OK to add to the safety margin.
    const threshold = this.config.keys.threshold
    return session.responses.length >= Math.max(threshold, this.signers.length - threshold + 1)
  }
}
