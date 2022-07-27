import {
  DisableDomainRequest,
  DisableDomainResponse,
  ErrorMessage,
} from '@celo/phone-number-privacy-common'
import { Response as FetchResponse } from 'node-fetch'
import { CombineAction } from '../../../common/combine'
import { IO } from '../../../common/io'
import { Session } from '../../../common/session'
import { OdisConfig } from '../../../config'

export class DomainDisableAction extends CombineAction<DisableDomainRequest> {
  constructor(readonly config: OdisConfig, readonly io: IO<DisableDomainRequest>) {
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
  ): Promise<DisableDomainResponse> {
    const res = await super.receiveSuccess(signerResponse, url, session)
    if (this.checkThresholdDisabled(session)) {
      session.abort.abort()
    }
    return res
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
