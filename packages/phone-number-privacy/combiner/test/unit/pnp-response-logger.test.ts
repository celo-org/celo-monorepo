import {
  ErrorMessage,
  KeyVersionInfo,
  OdisResponse,
  PnpQuotaRequest,
  rootLogger,
  SignMessageRequest,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { getSignerVersion } from '@celo/phone-number-privacy-signer/src/config'
import { Request, Response } from 'express'
import { Session } from '../../src/common/session'
import config, {
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  MAX_QUERY_COUNT_DISCREPANCY_THRESHOLD,
  MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD,
} from '../../src/config'
import { PnpSignerResponseLogger } from '../../src/pnp/services/log-responses'

describe('pnp response logger', () => {
  const url = 'test signer url'

  const keyVersionInfo: KeyVersionInfo = {
    keyVersion: 1,
    threshold: 3,
    polynomial: 'mock polynomial',
    pubKey: 'mock pubKey',
  }

  const getSession = (responses: OdisResponse<PnpQuotaRequest | SignMessageRequest>[]) => {
    const mockRequest = {
      body: {},
    } as Request
    const mockResponse = {
      locals: {
        logger: rootLogger(config.serviceName),
      },
    } as Response
    const session = new Session<PnpQuotaRequest | SignMessageRequest>(
      mockRequest,
      mockResponse,
      keyVersionInfo
    )
    responses.forEach((res) => {
      session.responses.push({ url, res, status: 200 })
    })
    return session
  }

  const pnpConfig = config.phoneNumberPrivacy
  pnpConfig.keys.currentVersion = keyVersionInfo.keyVersion
  pnpConfig.keys.versions = JSON.stringify([keyVersionInfo])
  const pnpResponseLogger = new PnpSignerResponseLogger()

  const version = getSignerVersion()
  const blockNumber = 1000000
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
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
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
          blockNumber,
          warnings,
        },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
      ],
      expectedLogs: [
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version: 'differentVersion',
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
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
        { success: true, performedQueryCount: 1, totalQuota, version, blockNumber, warnings },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
      ],
      expectedLogs: [
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount: 1,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
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
          blockNumber,
          warnings,
        },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
      ],
      expectedLogs: [
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
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
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
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
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        { success: true, performedQueryCount, totalQuota: 1, version, blockNumber, warnings },
      ],
      expectedLogs: [
        {
          params: [
            {
              parsedResponses: [
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota: 1,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
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
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        {
          success: true,
          performedQueryCount,
          totalQuota: totalQuota + MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD,
          version,
          blockNumber,
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
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
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
      it: 'should log correctly when one signer returns an undefined blockNumber',
      responses: [
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        {
          success: true,
          performedQueryCount,
          totalQuota,
          version,
          blockNumber: undefined,
          warnings,
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
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber: undefined,
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
        {
          params: [{ signerUrl: url }, 'Signer responded with undefined blockNumber'],
          level: 'warn',
        },
      ],
    },
    {
      it: 'should log correctly when there is a large discrepency in blockNumber field',
      responses: [
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        {
          success: true,
          performedQueryCount,
          totalQuota,
          version,
          blockNumber: blockNumber + MAX_BLOCK_DISCREPANCY_THRESHOLD,
          warnings,
        },
      ],
      expectedLogs: [
        {
          params: [
            {
              sortedByBlockNumber: [
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber: blockNumber + MAX_BLOCK_DISCREPANCY_THRESHOLD,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
              ],
            },
            WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS,
          ],
          level: 'error',
        },
      ],
    },
    {
      it: 'should log correctly when there is a discrepency in warnings field',
      responses: [
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        { success: true, performedQueryCount, totalQuota, version, blockNumber, warnings },
        {
          success: true,
          performedQueryCount,
          totalQuota,
          version,
          blockNumber,
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
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings,
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
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
    {
      it: 'should log correctly when signers respond with fail-open warnings',
      responses: [
        {
          success: true,
          performedQueryCount,
          totalQuota,
          version,
          blockNumber,
          warnings: [ErrorMessage.FAILING_OPEN],
        },
        {
          success: true,
          performedQueryCount,
          totalQuota,
          version,
          blockNumber,
          warnings: [ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA],
        },
        {
          success: true,
          performedQueryCount,
          totalQuota,
          version,
          blockNumber,
          warnings: [ErrorMessage.FAILURE_TO_GET_DEK],
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
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings: [ErrorMessage.FAILING_OPEN],
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings: [ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA],
                  },
                },
                {
                  signerUrl: url,
                  values: {
                    blockNumber,
                    performedQueryCount,
                    totalQuota,
                    version,
                    warnings: [ErrorMessage.FAILURE_TO_GET_DEK],
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
              warning: ErrorMessage.FAILING_OPEN,
              service: url,
            },
            ErrorMessage.FAILING_OPEN,
          ],
          level: 'error',
        },
        {
          params: [
            {
              warning: ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA,
              service: url,
            },
            ErrorMessage.FAILING_OPEN,
          ],
          level: 'error',
        },
        {
          params: [
            {
              warning: ErrorMessage.FAILURE_TO_GET_DEK,
              service: url,
            },
            ErrorMessage.FAILING_OPEN,
          ],
          level: 'error',
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
      pnpResponseLogger.logResponseDiscrepancies(session)
      pnpResponseLogger.logFailOpenResponses(session)
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
