import { DomainQuotaStatusRequest, ErrorMessage } from '@celo/phone-number-privacy-common'
import { Response as FetchResponse } from 'node-fetch'
import { OdisConfig } from '../../config'
import { CombineAbstract } from '../combine.abstract'
import { IOAbstract } from '../io.abstract'
import { Session } from '../session'
import { DomainStateCombinerService } from './state.service'

export class DomainQuotaAction extends CombineAbstract<DomainQuotaStatusRequest> {
  constructor(
    readonly config: OdisConfig,
    readonly io: IOAbstract<DomainQuotaStatusRequest>,
    readonly stateService: DomainStateCombinerService<DomainQuotaStatusRequest>
  ) {
    super(config, io)
  }

  async combine(session: Session<DomainQuotaStatusRequest>): Promise<void> {
    if (session.responses.length >= this.config.keys.threshold) {
      try {
        const domainQuotaStatus = this.stateService.findThresholdDomainState(session)
        this.io.sendSuccess(200, session.response, session.logger, domainQuotaStatus)
        return
      } catch (error) {
        session.logger.error({ error }, 'Error combining signer quota status responses')
      }
    }
    this.io.sendFailure(
      ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session.response,
      session.logger
    )
  }

  protected async receiveSuccess(
    signerResponse: FetchResponse,
    url: string,
    session: Session<DomainQuotaStatusRequest>
  ): Promise<void> {
    const status: number = signerResponse.status
    const data: string = await signerResponse.text()
    const res = this.io.validateSignerResponse(data, url, session)
    // In this function HTTP response status is assumed 200. Error if the response is failed.
    if (!res.success) {
      const msg = `Signer request to ${url + this.io.signerEndpoint} failed with 200 status`
      session.logger.error({ error: res.error, signer: url }, msg)
      throw new Error(msg)
    }
    session.logger.info({ signer: url }, `Signer request successful`)
    session.responses.push({ url, res, status })
  }
}
