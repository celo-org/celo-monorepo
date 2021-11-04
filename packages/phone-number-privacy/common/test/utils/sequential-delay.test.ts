import { defined, noBool, noNumber, noString } from '@celo/utils/lib/sign-typed-data-utils'
import {
  checkSequentialDelay,
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
      result = checkSequentialDelay(domain, attempt.timestamp, result?.state)
      expect(result).toEqual(attempt.expectedResult)
    }
  }

  describe('checkSequentialDelay', () => {
    it('should not accept attempts until initial delay', () => {
      const t = 0 // initial delay

      const domain: SequentialDelayDomain = {
        name: 'ODIS Sequential Delay Domain',
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
            state: undefined,
          },
        },
        {
          timestamp: t,
          expectedResult: {
            accepted: true,
            state: { timer: t, counter: 1 },
          },
        },
      ]

      checkTestAttempts(t, domain, attempts)
    })

    it('should accept multiple requests when batchSize is greater than one', () => {
      const t = 0 // initial delay

      const domain: SequentialDelayDomain = {
        name: 'ODIS Sequential Delay Domain',
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
            state: { timer: t + 1, counter: 1 },
          },
        },
        {
          timestamp: t + 1,
          expectedResult: {
            accepted: true,
            state: { timer: t + 1, counter: 2 },
          },
        },
        {
          timestamp: t + 1,
          expectedResult: {
            accepted: false,
            state: { timer: t + 1, counter: 2 },
          },
        },
      ]

      checkTestAttempts(t, domain, attempts)
    })

    it('should accumulate quota when resetTimer is false', () => {
      const t = 10 // initial delay

      const domain: SequentialDelayDomain = {
        name: 'ODIS Sequential Delay Domain',
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
            state: { timer: t, counter: 1 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t + 1, counter: 2 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t + 2, counter: 3 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t + 3, counter: 4 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: false,
            state: { timer: t + 3, counter: 4 },
          },
        },
      ]

      checkTestAttempts(t, domain, attempts)
    })

    it('should not accumulate quota when resetTimer is true', () => {
      const t = 0 // initial delay

      const domain: SequentialDelayDomain = {
        name: 'ODIS Sequential Delay Domain',
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
            state: { timer: t + 2, counter: 1 },
          },
        },
        {
          timestamp: t + 2,
          expectedResult: {
            accepted: false,
            state: { timer: t + 2, counter: 1 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t + 3, counter: 2 },
          },
        },
      ]

      checkTestAttempts(t, domain, attempts)
    })

    it('should return he correct results in the example sequence', () => {
      const t = 0 // initial delay

      const domain: SequentialDelayDomain = {
        name: 'ODIS Sequential Delay Domain',
        version: '1',
        stages: [
          { delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: noNumber },
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
            state: undefined,
          },
        },
        {
          timestamp: t,
          expectedResult: {
            accepted: true,
            state: { timer: t, counter: 1 },
          },
        },
        {
          timestamp: t + 1,
          expectedResult: {
            accepted: true,
            state: { timer: t + 1, counter: 2 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t + 2, counter: 3 },
          },
        },
        {
          timestamp: t + 3,
          expectedResult: {
            accepted: true,
            state: { timer: t + 3, counter: 4 },
          },
        },
        {
          timestamp: t + 6,
          expectedResult: {
            accepted: true,
            state: { timer: t + 5, counter: 5 },
          },
        },
        {
          timestamp: t + 8,
          expectedResult: {
            accepted: false,
            state: { timer: t + 5, counter: 5 },
          },
        },
        {
          timestamp: t + 9,
          expectedResult: {
            accepted: true,
            state: { timer: t + 9, counter: 6 },
          },
        },
        {
          timestamp: t + 10,
          expectedResult: {
            accepted: true,
            state: { timer: t + 10, counter: 7 },
          },
        },
        {
          timestamp: t + 14,
          expectedResult: {
            accepted: true,
            state: { timer: t + 14, counter: 8 },
          },
        },
        {
          timestamp: t + 15,
          expectedResult: {
            accepted: true,
            state: { timer: t + 15, counter: 9 },
          },
        },
      ]

      checkTestAttempts(t, domain, attempts)
    })
  })
})
