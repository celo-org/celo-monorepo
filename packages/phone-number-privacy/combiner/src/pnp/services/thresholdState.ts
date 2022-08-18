import { PnpQuotaRequest, PnpQuotaResponseSuccess } from '@celo/phone-number-privacy-common'
import { Session } from '../../common/session'
import { OdisConfig } from '../../config'

export class CombinerThresholdStateService<R extends PnpQuotaRequest> {
  constructor(readonly config: OdisConfig) {}

  findCombinerQuotaState(session: Session<R>) {
    const signerResponses: PnpQuotaResponseSuccess[] = session.responses
      .map((signerResponse) => signerResponse.res)
      .filter((res) => res.success)
      .sort((a, b) => a.totalQuota - b.totalQuota)

    const threshold = this.config.keys.threshold
    if (signerResponses.length < threshold) {
      throw new Error('Insufficient number of successful signer responses')
    }

    return signerResponses[threshold].totalQuota
  }
}
