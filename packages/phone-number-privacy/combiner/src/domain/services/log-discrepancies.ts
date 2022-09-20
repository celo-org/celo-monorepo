import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRestrictedSignatureRequest,
  DomainState,
  SequentialDelayDomain,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Session } from '../../common/session'

// TODO EN: no idea why using a type parameter throws errors when building
export class DomainDiscrepanciesLogger {
  logResponseDiscrepancies(
    session:
      | Session<DomainRestrictedSignatureRequest>
      | Session<DomainQuotaStatusRequest>
      | Session<DisableDomainRequest>
  ): void {
    const parsedResponses: Array<{
      signerUrl: string
      values: {
        version: string
        status: DomainState<SequentialDelayDomain>
      }
    }> = []
    session.responses.forEach((response) => {
      if (response.res.success) {
        const { version, status } = response.res
        parsedResponses.push({
          signerUrl: response.url,
          values: { version, status },
        })
      }
    })
    if (parsedResponses.length === 0) {
      session.logger.warn('No successful responses found!')
      return
    }

    // log all responses if we notice any discrepancies to aid with debugging
    const first = JSON.stringify(parsedResponses[0].values)
    for (let i = 1; i < parsedResponses.length; i++) {
      if (JSON.stringify(parsedResponses[i].values) !== first) {
        session.logger.warn({ parsedResponses }, 'Discrepancies detected in signer responses')
        break
      }
    }

    // disabled
    const numDisabled = parsedResponses.filter((res) => res.values.status.disabled).length
    if (numDisabled > 0 && numDisabled < parsedResponses.length) {
      session.logger.error(
        { parsedResponses },
        WarningMessage.INCONSISTENT_SIGNER_DOMAIN_DISABLED_STATES
      )
    }
  }
}
