import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRequest,
  DomainRestrictedSignatureRequest,
  KeyVersionInfo,
  OdisResponse,
  rootLogger,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { getSignerVersion } from '@celo/phone-number-privacy-signer/src/config'
import { Request, Response } from 'express'
import { Session } from '../../src/common/session'
import config from '../../src/config'
import { DomainSignerResponseLogger } from '../../src/domain/services/log-responses'

describe('domain response logger', () => {
  const url = 'test signer url'

  const keyVersionInfo: KeyVersionInfo = {
    keyVersion: 1,
    threshold: 3,
    polynomial: 'mock polynomial',
    pubKey: 'mock pubKey',
  }

  const getSession = (responses: OdisResponse<DomainRequest>[]) => {
    const mockRequest = {
      body: {},
    } as Request
    const mockResponse = {
      locals: {
        logger: rootLogger(config.serviceName),
      },
    } as Response
    const session = new Session<DomainRequest>(mockRequest, mockResponse, keyVersionInfo)
    responses.forEach((res) => {
      session.responses.push({ url, res, status: 200 })
    })
    return session
  }

  const version = getSignerVersion()
  const counter = 1
  const disabled = false
  const timer = 10000
  const domainResponseLogger = new DomainSignerResponseLogger()

  const testCases: {
    it: string
    responses: OdisResponse<
      DomainRestrictedSignatureRequest | DomainQuotaStatusRequest | DisableDomainRequest
    >[]
    expectedLogs: {
      params: string | any[]
      level: 'info' | 'debug' | 'warn' | 'error'
    }[]
  }[] = [
    {
      it: 'should log correctly when no responses provided',
      responses: [],
      expectedLogs: [
        {
          params: ['No successful signer responses found!'],
          level: 'warn',
        },
      ],
    },
    {
      it: 'should log correctly when all the responses are the same (except for now field)',
      responses: [
        { success: true, version, status: { counter, timer, disabled, now: Date.now() } },
        { success: true, version, status: { counter, timer, disabled, now: Date.now() } },
        { success: true, version, status: { counter, timer, disabled, now: Date.now() } },
      ],
      expectedLogs: [],
    },
    {
      it: 'should log correctly when there is a discrepency in version field',
      responses: [
        { success: true, version, status: { counter, timer, disabled, now: Date.now() } },
        { success: true, version, status: { counter, timer, disabled, now: Date.now() } },
        {
          success: true,
          version: 'differentVersion',
          status: { counter, timer, disabled, now: Date.now() },
        },
      ],
      expectedLogs: [
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled,
                    timer,
                    version,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled,
                    timer,
                    version,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled,
                    timer,
                    version: 'differentVersion',
                  },
                },
              ],
            },
            WarningMessage.SIGNER_RESPONSE_DISCREPANCIES,
          ],
          level: 'warn',
        },
      ],
    },
    {
      it: 'should log correctly when there is a discrepency in counter field',
      responses: [
        { success: true, version, status: { counter, timer, disabled, now: Date.now() } },
        { success: true, version, status: { counter, timer, disabled, now: Date.now() } },
        {
          success: true,
          version,
          status: { counter: counter + 1, timer, disabled, now: Date.now() },
        },
      ],
      expectedLogs: [
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled,
                    timer,
                    version,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled,
                    timer,
                    version,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    counter: counter + 1,
                    disabled,
                    timer,
                    version,
                  },
                },
              ],
            },
            WarningMessage.SIGNER_RESPONSE_DISCREPANCIES,
          ],
          level: 'warn',
        },
      ],
    },
    {
      it: 'should log correctly when there is a discrepency in disabled field',
      responses: [
        { success: true, version, status: { counter, timer, disabled, now: Date.now() } },
        { success: true, version, status: { counter, timer, disabled, now: Date.now() } },
        { success: true, version, status: { counter, timer, disabled: true, now: Date.now() } },
      ],
      expectedLogs: [
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled,
                    timer,
                    version,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled,
                    timer,
                    version,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled: true,
                    timer,
                    version,
                  },
                },
              ],
            },
            WarningMessage.SIGNER_RESPONSE_DISCREPANCIES,
          ],
          level: 'warn',
        },
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled,
                    timer,
                    version,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled,
                    timer,
                    version,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled: true,
                    timer,
                    version,
                  },
                },
              ],
            },
            WarningMessage.INCONSISTENT_SIGNER_DOMAIN_DISABLED_STATES,
          ],
          level: 'error',
        },
      ],
    },
    {
      it: 'should log correctly when there is a discrepency in timer field',
      responses: [
        { success: true, version, status: { counter, timer, disabled, now: Date.now() } },
        { success: true, version, status: { counter, timer, disabled, now: Date.now() } },
        {
          success: true,
          version,
          status: { counter, timer: timer + 1, disabled, now: Date.now() },
        },
      ],
      expectedLogs: [
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled,
                    timer,
                    version,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled,
                    timer,
                    version,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    counter,
                    disabled,
                    timer: timer + 1,
                    version,
                  },
                },
              ],
            },
            WarningMessage.SIGNER_RESPONSE_DISCREPANCIES,
          ],
          level: 'warn',
        },
      ],
    },
  ]
  testCases.forEach((testCase) => {
    it(testCase.it, () => {
      const session = getSession(testCase.responses)
      const logSpys = {
        info: {
          spy: jest.spyOn(session.logger, 'info'),
          callCount: 0,
        },
        debug: {
          spy: jest.spyOn(session.logger, 'debug'),
          callCount: 0,
        },
        warn: {
          spy: jest.spyOn(session.logger, 'warn'),
          callCount: 0,
        },
        error: {
          spy: jest.spyOn(session.logger, 'error'),
          callCount: 0,
        },
      }
      domainResponseLogger.logResponseDiscrepancies(session)
      testCase.expectedLogs.forEach((log) => {
        expect(logSpys[log.level].spy).toHaveBeenNthCalledWith(
          ++logSpys[log.level].callCount,
          ...log.params
        )
      })
      Object.values(logSpys).forEach((level) => {
        level.spy.mockClear()
        level.spy.mockRestore()
      })
    })
  })
})
