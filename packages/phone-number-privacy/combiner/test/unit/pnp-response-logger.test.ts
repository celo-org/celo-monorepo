import {
  KeyVersionInfo,
  OdisResponse,
  PnpQuotaRequest,
  rootLogger,
  SignMessageRequest,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { getSignerVersion } from '@celo/phone-number-privacy-signer/src/config'
import config, {
  MAX_QUERY_COUNT_DISCREPANCY_THRESHOLD,
  MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD,
} from '../../src/config'
import { logPnpSignerResponseDiscrepancies } from '../../src/pnp/services/log-responses'

describe('pnp response logger', () => {
  const url = 'test signer url'

  const keyVersionInfo: KeyVersionInfo = {
    keyVersion: 1,
    threshold: 3,
    polynomial: 'mock polynomial',
    pubKey: 'mock pubKey',
  }

  const pnpConfig = config.phoneNumberPrivacy
  pnpConfig.keys.currentVersion = keyVersionInfo.keyVersion
  pnpConfig.keys.versions = JSON.stringify([keyVersionInfo])

  const version = getSignerVersion()

  const totalQuota = 10
  const performedQueryCount = 5
  const warnings = ['warning']

  const testCases: {
    it: string
    responses: OdisResponse<PnpQuotaRequest | SignMessageRequest>[]
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
      it: 'should log correctly when all the responses are the same',
      responses: [
        { success: true, performedQueryCount, totalQuota, version, warnings },
        { success: true, performedQueryCount, totalQuota, version, warnings },
        { success: true, performedQueryCount, totalQuota, version, warnings },
      ],
      expectedLogs: [],
    },
    {
      it: 'should log correctly when there is a discrepency in version field',
      responses: [
        {
          success: true,
          performedQueryCount,
          totalQuota,
          version: 'differentVersion',

          warnings,
        },
        { success: true, performedQueryCount, totalQuota, version, warnings },
        { success: true, performedQueryCount, totalQuota, version, warnings },
      ],
      expectedLogs: [
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version: 'differentVersion',
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
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
      it: 'should log correctly when there is a discrepency in performedQueryCount field',
      responses: [
        { success: true, performedQueryCount: 1, totalQuota, version, warnings },
        { success: true, performedQueryCount, totalQuota, version, warnings },
        { success: true, performedQueryCount, totalQuota, version, warnings },
      ],
      expectedLogs: [
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount: 1,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
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
      it: 'should log correctly when there is a large discrepency in performedQueryCount field',
      responses: [
        {
          success: true,
          performedQueryCount: performedQueryCount + MAX_QUERY_COUNT_DISCREPANCY_THRESHOLD,
          totalQuota,
          version,

          warnings,
        },
        { success: true, performedQueryCount, totalQuota, version, warnings },
        { success: true, performedQueryCount, totalQuota, version, warnings },
      ],
      expectedLogs: [
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount:
                      performedQueryCount + MAX_QUERY_COUNT_DISCREPANCY_THRESHOLD,
                    totalQuota,
                    version,
                    warnings,
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
              sortedByQueryCount: [
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount:
                      performedQueryCount + MAX_QUERY_COUNT_DISCREPANCY_THRESHOLD,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
              ],
            },
            WarningMessage.INCONSISTENT_SIGNER_QUERY_MEASUREMENTS,
          ],
          level: 'error',
        },
      ],
    },
    {
      it: 'should log correctly when there is a discrepency in totalQuota field',
      responses: [
        { success: true, performedQueryCount, totalQuota, version, warnings },
        { success: true, performedQueryCount, totalQuota, version, warnings },
        { success: true, performedQueryCount, totalQuota: 1, version, warnings },
      ],
      expectedLogs: [
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota: 1,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
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
      it: 'should log correctly when there is a large discrepency in totalQuota field',
      responses: [
        { success: true, performedQueryCount, totalQuota, version, warnings },
        { success: true, performedQueryCount, totalQuota, version, warnings },
        {
          success: true,
          performedQueryCount,
          totalQuota: totalQuota + MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD,
          version,

          warnings,
        },
      ],
      expectedLogs: [
        {
          params: [
            {
              sortedByTotalQuota: [
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota: totalQuota + MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD,
                    version,
                    warnings,
                  },
                },
              ],
            },
            WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS,
          ],
          level: 'error',
        },
      ],
    },
    {
      it: 'should log correctly when there is a discrepency in warnings field',
      responses: [
        { success: true, performedQueryCount, totalQuota, version, warnings },
        { success: true, performedQueryCount, totalQuota, version, warnings },
        {
          success: true,
          performedQueryCount,
          totalQuota,
          version,

          warnings: ['differentWarning'],
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
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings: ['differentWarning'],
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
      const logger = rootLogger(config.serviceName)

      const responses = testCase.responses.map((res) => ({ res, url }))
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
      logPnpSignerResponseDiscrepancies(logger, responses)
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
