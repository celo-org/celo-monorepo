import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRestrictedSignatureRequest,
  OdisResponse,
  rootLogger,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { getSignerVersion } from '@celo/phone-number-privacy-signer/src/config'

import config from '../../src/config'
import { logDomainResponseDiscrepancies } from '../../src/domain/services/log-responses'

describe('domain response logger', () => {
  const url = 'test signer url'

  const logger = rootLogger(config.serviceName)

  const version = getSignerVersion()
  const counter = 1
  const disabled = false
  const timer = 10000

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
      const logSpys = {
        info: {
          spy: jest.spyOn(logger, 'info'),
          callCount: 0,
        },
        debug: {
          spy: jest.spyOn(logger, 'debug'),
          callCount: 0,
        },
        warn: {
          spy: jest.spyOn(logger, 'warn'),
          callCount: 0,
        },
        error: {
          spy: jest.spyOn(logger, 'error'),
          callCount: 0,
        },
      }
      logDomainResponseDiscrepancies(
        logger,
        testCase.responses.map((res) => ({ url, res }))
      )
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
