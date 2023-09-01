import {
  DomainQuotaStatusResponseSuccess,
  DomainRestrictedSignatureResponseSuccess,
  KeyVersionInfo,
} from '@celo/phone-number-privacy-common'
import { getSignerVersion } from '@celo/phone-number-privacy-signer/src/config'
import { findThresholdDomainState } from '../../src/domain/services/threshold-state'

describe('domain threshold state', () => {
  // TODO add tests with failed signer responses, depending on
  // result of https://github.com/celo-org/celo-monorepo/issues/9826

  const keyVersionInfo: KeyVersionInfo = {
    keyVersion: 1,
    threshold: 3,
    polynomial: 'mock polynomial',
    pubKey: 'mock pubKey',
  }

  const totalSigners = 4

  const expectedVersion = getSignerVersion()
  const now = Date.now()
  const timer = now - 1
  const counter = 2

  const varyingDomainStates = [
    {
      statuses: [
        { timer, counter: 2, disabled: false, now },
        { timer, counter: 2, disabled: false, now },
        { timer, counter: 2, disabled: false, now },
        { timer, counter: 2, disabled: false, now },
      ],
      expectedCounter: 2,
      expectedTimer: timer,
    },
    {
      statuses: [
        { timer, counter: 1, disabled: false, now },
        { timer, counter: 2, disabled: false, now },
        { timer, counter: 2, disabled: false, now },
        { timer, counter: 2, disabled: false, now },
      ],
      expectedCounter: 2,
      expectedTimer: timer,
    },
    {
      statuses: [
        { timer, counter: 0, disabled: false, now },
        { timer, counter: 1, disabled: false, now },
        { timer, counter: 2, disabled: false, now },
        { timer, counter: 3, disabled: false, now },
      ],
      expectedCounter: 2,
      expectedTimer: timer,
    },
    {
      statuses: [
        { timer, counter: 0, disabled: true, now },
        { timer, counter: 1, disabled: false, now },
        { timer, counter: 2, disabled: false, now },
        { timer, counter: 3, disabled: false, now },
      ],
      expectedCounter: 3,
      expectedTimer: timer,
    },
    {
      statuses: [
        { timer: timer - 1, counter, disabled: false, now },
        { timer, counter, disabled: false, now },
        { timer, counter, disabled: false, now },
        { timer, counter, disabled: false, now },
      ],
      expectedCounter: counter,
      expectedTimer: timer,
    },
    {
      statuses: [
        { timer: timer - 1, counter, disabled: false, now },
        { timer: timer - 1, counter, disabled: false, now },
        { timer: timer - 1, counter, disabled: false, now },
        { timer, counter, disabled: false, now },
      ],
      expectedCounter: counter,
      expectedTimer: timer - 1,
    },
    {
      statuses: [
        { timer: timer - 1, counter: 1, disabled: false, now },
        { timer, counter: 1, disabled: false, now },
        { timer, counter: 2, disabled: false, now },
        { timer, counter: 3, disabled: false, now },
      ],
      expectedCounter: 2,
      expectedTimer: timer,
    },
  ]

  varyingDomainStates.forEach(({ statuses, expectedCounter, expectedTimer }) => {
    it(`should return counter:${expectedCounter} and timer:${expectedTimer} given the domain states: ${statuses}`, () => {
      const responses = statuses.map((status) => {
        const res: DomainRestrictedSignatureResponseSuccess | DomainQuotaStatusResponseSuccess = {
          success: true,
          version: expectedVersion,
          status,
        }
        return { url: 'random url', res, status: 200 }
      })
      const thresholdResult = findThresholdDomainState(keyVersionInfo, responses, totalSigners)

      expect(thresholdResult).toStrictEqual({
        timer: expectedTimer,
        counter: expectedCounter,
        disabled: false,
        now,
      })
    })
  })

  it('should return 0 values when too many disabled responses', () => {
    const statuses = [
      { timer, counter: 0, disabled: true, now },
      { timer, counter: 1, disabled: true, now },
      { timer, counter: 2, disabled: false, now },
      { timer, counter: 2, disabled: false, now },
    ]

    const responses = statuses.map((status) => {
      const res: DomainRestrictedSignatureResponseSuccess | DomainQuotaStatusResponseSuccess = {
        success: true,
        version: expectedVersion,
        status,
      }
      return { url: 'random url', res, status: 200 }
    })
    const thresholdResult = findThresholdDomainState(keyVersionInfo, responses, totalSigners)

    expect(thresholdResult).toStrictEqual({ timer: 0, counter: 0, disabled: true, now: 0 })
  })

  it('should throw an error if not enough signer responses', () => {
    const statuses = [
      { timer, counter: 1, disabled: true, now },
      { timer, counter: 2, disabled: false, now },
      { timer, counter: 2, disabled: false, now },
    ]
    const responses = statuses.map((status) => {
      const res: DomainRestrictedSignatureResponseSuccess | DomainQuotaStatusResponseSuccess = {
        success: true,
        version: expectedVersion,
        status,
      }
      return { url: 'random url', res, status: 200 }
    })

    expect(() => findThresholdDomainState(keyVersionInfo, responses, totalSigners)).toThrow(
      'Insufficient number of signer responses. Domain may be disabled'
    )
  })
})
