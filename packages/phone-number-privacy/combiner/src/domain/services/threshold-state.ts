import { DomainRequest, DomainState, KeyVersionInfo } from '@celo/phone-number-privacy-common'
import { SignerResponse } from '../../common/io'

export function findThresholdDomainState<R extends DomainRequest>(
  keyVersionInfo: KeyVersionInfo,
  rawSignerResponses: Array<SignerResponse<R>>,
  totalSigners: number
): DomainState {
  const { threshold } = keyVersionInfo
  // Get the domain status from the responses, filtering out responses that don't have the status.
  const domainStates = rawSignerResponses
    .map((signerResponse) => ('status' in signerResponse.res ? signerResponse.res.status : null))
    .filter((state: DomainState | null | undefined): state is DomainState => !!state)

  // Note: when the threshold > # total signers - threshold, it's possible that we
  // throw an error here when the domain is disabled. While the domain is technically disabled,
  // the hope is to increase the "safety margin" of the number of signers that have
  // also disabled this domain.This can be changed in the future (if we think that
  // the safety margin is no longer needed) by simply checking if the domain is disabled
  // before checking if the threshold of enabled responses has been met.
  if (domainStates.length < threshold) {
    throw new Error('Insufficient number of signer responses')
  }

  // Check whether the domain is disabled, either by all signers or by some.
  const domainStatesEnabled = domainStates.filter((ds) => !ds.disabled)
  const numDisabled = domainStates.length - domainStatesEnabled.length

  if (totalSigners - numDisabled < threshold) {
    return { timer: 0, counter: 0, disabled: true, now: 0 }
  }

  // Ideally users will resubmit the request in this case.
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
