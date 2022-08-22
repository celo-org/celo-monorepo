import { defined, noBool, noNumber, noString } from '@celo/utils/lib/sign-typed-data-utils'
import {
  checkSequentialDelayRateLimit,
  DomainIdentifiers,
  SequentialDelayDomain,
  SequentialDelayResult,
} from '../../src/domains'

type TestAttempt = {
  timestamp: number
  expectedResult: SequentialDelayResult
}

describe('Sequential Delay Test Suite', () => {
  const checkTestAttempts = (t: number, domain: SequentialDelayDomain, attempts: TestAttempt[]) => {
    let result: SequentialDelayResult | undefined
    for (const attempt of attempts) {
      console.log(result)
      console.log(`t + ${attempt.timestamp - t}`)
      result = checkSequentialDelayRateLimit(domain, attempt.timestamp, result?.state)
      expect(result).toEqual(attempt.expectedResult)
    }
  }

  describe('checkSequentialDelayRateLimit', () => {
    it('should not accept attempts until initial delay', () => {
      const t = 0 // initial delay

      const domain: SequentialDelayDomain = {
        name: DomainIdentifiers.SequentialDelay,
        version: '1',
        stages: [{ delay: t, resetTimer: noBool, batchSize: noNumber, repetitions: noNumber }],
        address: noString,
        salt: noString,
      }

      const attempts: TestAttempt[] = [
        {
          timestamp: t - 1,
          expectedResult: {
            accepted: false,
            notBefore: 0,
            state: { timer: 0, counter: 0, disabled: false, now: t - 1 },
          },
        },
        {
          timestamp: t,
          expectedResult: {
            accepted: true,
            state: { timer: t, counter: 1, disabled: false, now: t },
          },
        },
      ]

      checkTestAttempts(t, domain, attempts)
    })

    it('should accept multiple requests when batchSize is greater than one', () => {
      const t = 0 // initial delay

      const domain: SequentialDelayDomain = {
        name: DomainIdentifiers.SequentialDelay,
        version: '1',
        stages: [{ delay: t, batchSize: defined(2), resetTimer: noBool, repetitions: noNumber }],
        address: noString,
        salt: noString,
      }

      const attempts: TestAttempt[] = [
        {
          timestamp: t + 1,
          expectedResult: {
            accepted: true,
            state: { timer: t + 1, counter: 1, disabled: false, now: t + 1 },
          },
        },
        {
          timestamp: t + 1,
          expectedResult: {
            accepted: true,
            state: { timer: t + 1, counter: 2, disabled: false, now: t + 1 },
          },
        },
        {
          timestamp: t + 1,
          expectedResult: {
            accepted: false,
            notBefore: undefined,
            state: { timer: t + 1, counter: 2, disabled: false, now: t + 1 },
          },
        },
      ]

      checkTestAttempts(t, domain, attempts)
    })

    it('should reject requests when disabled is true', () => {
      const t = 0 // initial delay

      const domain: SequentialDelayDomain = {
        name: DomainIdentifiers.SequentialDelay,
        version: '1',
        stages: [{ delay: t, batchSize: defined(2), resetTimer: noBool, repetitions: noNumber }],
        address: noString,
        salt: noString,
      }

      let result: SequentialDelayResult | undefined
      result = checkSequentialDelayRateLimit(domain, t + 1, result?.state)
      expect(result).toEqual({
        accepted: true,
        state: { timer: t + 1, counter: 1, disabled: false, now: t + 1 },
      })

      // Set the domain to disabled and attempt to make another reqeust.
      result!.state!.disabled = true
      result = checkSequentialDelayRateLimit(domain, t + 1, result?.state)
      expect(result).toEqual({
        accepted: false,
        notBefore: undefined,
        state: { timer: t + 1, counter: 1, disabled: true, now: t + 1 },
      })
    })

    it('should accumulate quota when resetTimer is false', () => {
      const t = 10 // initial delay

      const domain: SequentialDelayDomain = {
        name: DomainIdentifiers.SequentialDelay,
        version: '1',
        stages: [
          { delay: t, resetTimer: defined(false), batchSize: noNumber, repetitions: noNumber },
          { delay: 1, resetTimer: defined(false), batchSize: noNumber, repetitions: noNumber },
          { delay: 1, resetTimer: defined(false), batchSize: noNumber, repetitions: noNumber },
          { delay: 1, resetTimer: defined(false), batchSize: noNumber, repetitions: noNumber },
        ],
        address: noString,
        salt: noString,
      }

      const attempts: TestAttempt[] = [
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t, counter: 1, disabled: false, now: t + 3 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t + 1, counter: 2, disabled: false, now: t + 3 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t + 2, counter: 3, disabled: false, now: t + 3 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t + 3, counter: 4, disabled: false, now: t + 3 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: false,
            notBefore: undefined,
            state: { timer: t + 3, counter: 4, disabled: false, now: t + 3 },
          },
        },
      ]

      checkTestAttempts(t, domain, attempts)
    })

    it('should not accumulate quota when resetTimer is true', () => {
      const t = 0 // initial delay

      const domain: SequentialDelayDomain = {
        name: DomainIdentifiers.SequentialDelay,
        version: '1',
        stages: [
          { delay: t, resetTimer: noBool, batchSize: noNumber, repetitions: noNumber },
          { delay: 1, resetTimer: noBool, batchSize: noNumber, repetitions: noNumber },
        ],
        address: noString,
        salt: noString,
      }

      const attempts: TestAttempt[] = [
        {
          timestamp: t + 2,
          expectedResult: {
            accepted: true,
            state: { timer: t + 2, counter: 1, disabled: false, now: t + 2 },
          },
        },
        {
          timestamp: t + 2,
          expectedResult: {
            accepted: false,
            notBefore: t + 3,
            state: { timer: t + 2, counter: 1, disabled: false, now: t + 2 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t + 3, counter: 2, disabled: false, now: t + 3 },
          },
        },
      ]

      checkTestAttempts(t, domain, attempts)
    })

    it('should return the correct results in the example sequence', () => {
      const t = 10 // initial delay

      const domain: SequentialDelayDomain = {
        name: DomainIdentifiers.SequentialDelay,
        version: '1',
        stages: [
          { delay: t, resetTimer: noBool, batchSize: defined(2), repetitions: noNumber },
          { delay: 1, resetTimer: defined(false), batchSize: noNumber, repetitions: noNumber },
          { delay: 1, resetTimer: defined(true), batchSize: noNumber, repetitions: noNumber },
          { delay: 2, resetTimer: defined(false), batchSize: noNumber, repetitions: defined(1) },
          { delay: 4, resetTimer: noBool, batchSize: defined(2), repetitions: defined(2) },
        ],
        address: noString,
        salt: noString,
      }

      const attempts: TestAttempt[] = [
        {
          timestamp: t - 1,
          expectedResult: {
            accepted: false,
            notBefore: t,
            state: { timer: 0, counter: 0, disabled: false, now: t - 1 },
          },
        },
        {
          timestamp: t,
          expectedResult: {
            accepted: true,
            state: { timer: t, counter: 1, disabled: false, now: t },
          },
        },
        {
          timestamp: t + 1,
          expectedResult: {
            accepted: true,
            state: { timer: t + 1, counter: 2, disabled: false, now: t + 1 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t + 2, counter: 3, disabled: false, now: t + 3 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t + 3, counter: 4, disabled: false, now: t + 3 },
          },
        },
        {
          timestamp: t + 6,
          expectedResult: {
            accepted: true,
            state: { timer: t + 5, counter: 5, disabled: false, now: t + 6 },
          },
        },
        {
          timestamp: t + 8,
          expectedResult: {
            accepted: false,
            notBefore: t + 9,
            state: { timer: t + 5, counter: 5, disabled: false, now: t + 8 },
          },
        },
        {
          timestamp: t + 9,
          expectedResult: {
            accepted: true,
            state: { timer: t + 9, counter: 6, disabled: false, now: t + 9 },
          },
        },
        {
          timestamp: t + 10,
          expectedResult: {
            accepted: true,
            state: { timer: t + 10, counter: 7, disabled: false, now: t + 10 },
          },
        },
        {
          timestamp: t + 14,
          expectedResult: {
            accepted: true,
            state: { timer: t + 14, counter: 8, disabled: false, now: t + 14 },
          },
        },
        {
          timestamp: t + 15,
          expectedResult: {
            accepted: true,
            state: { timer: t + 15, counter: 9, disabled: false, now: t + 15 },
          },
        },
      ]

      checkTestAttempts(t, domain, attempts)
    })
  })
})
