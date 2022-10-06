import {
  DomainQuotaStatusResponseSuccess,
  DomainRestrictedSignatureResponseSuccess,
  SequentialDelayDomainState,
} from '@celo/phone-number-privacy-common'
import { getVersion } from '@celo/phone-number-privacy-signer/src/config'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Session } from '../../src/common/session'
import config from '../../src/config'
import { DomainThresholdStateService } from '../../src/domain/services/threshold-state'

describe('domain threshold state', () => {
  // TODO(2.0.0): add tests with failed signer responses, depending on
  // result of https://github.com/celo-org/celo-monorepo/issues/9826

  const getSession = (domainStates: SequentialDelayDomainState[]) => {
    const mockRequest = {
      body: {},
    } as Request
    const mockResponse = {
      locals: {
        logger: new Logger({ name: 'logger' }),
      },
    } as Response
    const session = new Session(mockRequest, mockResponse)
    domainStates.forEach((status) => {
      const res: DomainRestrictedSignatureResponseSuccess | DomainQuotaStatusResponseSuccess = {
        success: true,
        version: expectedVersion,
        status,
      }
      session.responses.push({ url: 'random url', res, status: 200 })
    })
    return session
  }

  const domainConfig = config.domains
  domainConfig.keys.threshold = 3
  domainConfig.odisServices.signers =
    '[{"url": "http://localhost:3001", "fallbackUrl": "http://localhost:3001/fallback"}, {"url": "http://localhost:3002", "fallbackUrl": "http://localhost:3002/fallback"}, {"url": "http://localhost:3003", "fallbackUrl": "http://localhost:3003/fallback"}, {"url": "http://localhost:4004", "fallbackUrl": "http://localhost:4004/fallback"}]'
  const domainThresholdStateService = new DomainThresholdStateService(domainConfig)

  const expectedVersion = getVersion()
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
      const session = getSession(statuses)
      const thresholdResult = domainThresholdStateService.findThresholdDomainState(session)

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
    const session = getSession(statuses)
    const thresholdResult = domainThresholdStateService.findThresholdDomainState(session)

    expect(thresholdResult).toStrictEqual({ timer: 0, counter: 0, disabled: true, now: 0 })
  })

  it('should throw an error if not enough signer responses', () => {
    const statuses = [
      { timer, counter: 1, disabled: true, now },
      { timer, counter: 2, disabled: false, now },
      { timer, counter: 2, disabled: false, now },
    ]
    const session = getSession(statuses)

    expect(() => domainThresholdStateService.findThresholdDomainState(session)).toThrow(
      'Insufficient number of signer responses. Domain may be disabled'
    )
  })
})
