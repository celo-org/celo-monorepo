import {
  DomainQuotaStatusRequest,
  DomainRestrictedSignatureRequest,
  DomainState,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Session } from '../../common/session'
import { OdisConfig } from '../../config'

export class DomainThresholdStateService<
  R extends DomainQuotaStatusRequest | DomainRestrictedSignatureRequest
> {
  constructor(readonly config: OdisConfig) {}

  findThresholdDomainState(session: Session<R>): DomainState {
    // Get the domain status from the responses, filtering out responses that don't have the status.
    const domainStates = session.responses
      .map((signerResponse) => ('status' in signerResponse.res ? signerResponse.res.status : null))
      .filter((state) => state ?? false) as DomainState[]
    const threshold = this.config.keys.threshold
    if (domainStates.length < threshold) {
      throw new Error('Insufficient number of signer responses')
    }

    // Check whether the domain is disabled, either by all signers or by some.
    const domainStatesEnabled = domainStates.filter((ds) => !ds.disabled)
    const numDisabled = domainStates.length - domainStatesEnabled.length

    if (numDisabled > 0 && numDisabled < domainStates.length) {
      session.logger.warn(WarningMessage.INCONSISTENT_SIGNER_DOMAIN_DISABLED_STATES)
    }

    if (this.config.odisServices.signers.length - numDisabled < threshold) {
      return { timer: 0, counter: 0, disabled: true, now: 0 }
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

    const domainStatesAscendingByTimestampRestrictiveness = domainStatesWithThresholdCounter.sort(
      (a, b) => a.timer - a.now - (b.timer - b.now)
      /**
       * Please see '@celo/phone-number-privacy-common/src/domains/sequential-delay.ts'
       * and https://github.com/celo-org/celo-proposals/blob/master/CIPs/CIP-0040/sequentialDelayDomain.md
       *
       * For a given DomainState, it is always the case that 'now' >= 'timer'. This ordering ensures
       * that we take the 'timer' and 'date' from the same DomainState while still returning a reasonable
       * definition of the "nth least restrictive" values. For simplicity, we do not take into consideration
       * the 'delay' until the next request will be accepted as that would require calculating this value for
       * each DomainState with the checkSequentialDelayDomainState algorithm in sequential-delay.ts.
       * This would add complexity because DomainStates may have different values for 'counter' that dramatically
       * alter this 'delay' and we want to protect the user's quota by returning the lowest possible
       * threshold 'counter'. Feel free to implement a more exact solution if you're up for a coding challenge :)
       */
    )
    const nthLeastRestrictiveByTimestamps = domainStatesAscendingByTimestampRestrictiveness[n]

    return {
      timer: nthLeastRestrictiveByTimestamps.timer,
      counter: thresholdCounter,
      disabled: false,
      now: nthLeastRestrictiveByTimestamps.now,
    }
  }
}
