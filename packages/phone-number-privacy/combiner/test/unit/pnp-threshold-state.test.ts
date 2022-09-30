import {
  PnpQuotaRequest,
  PnpQuotaResponseSuccess,
  rootLogger,
  SignMessageRequest,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { getVersion } from '@celo/phone-number-privacy-signer/src/config'
import { Request, Response } from 'express'
import { Session } from '../../src/common/session'
import config from '../../src/config'
import { PnpThresholdStateService } from '../../src/pnp/services/threshold-state'

describe('pnp threshold state', () => {
  // TODO(2.0.0): add tests with failed signer responses, depending on
  // result of https://github.com/celo-org/celo-monorepo/issues/9826

  const getSession = (quotaData: { totalQuota: number; performedQueryCount: number }[]) => {
    const mockRequest = {
      body: {},
    } as Request
    const mockResponse = {
      locals: {
        logger: rootLogger,
      },
    } as Response
    const session = new Session<PnpQuotaRequest | SignMessageRequest>(mockRequest, mockResponse)
    quotaData.forEach((q) => {
      const res: PnpQuotaResponseSuccess | SignMessageResponseSuccess = {
        success: true,
        version: expectedVersion,
        ...q,
        blockNumber: testBlockNumber,
      }
      session.responses.push({ url: 'random url', res, status: 200 })
    })
    return session
  }

  const pnpConfig = config.phoneNumberPrivacy
  pnpConfig.keys.threshold = 3
  const pnpThresholdStateService = new PnpThresholdStateService(pnpConfig)

  const expectedVersion = getVersion()
  const testBlockNumber = 1000000
  const totalQuota = 10
  const performedQueryCount = 5

  const varyingQueryCount = [
    {
      signerRes: [
        { performedQueryCount: 0, totalQuota },
        { performedQueryCount: 0, totalQuota },
        { performedQueryCount: 0, totalQuota },
        { performedQueryCount: 0, totalQuota },
      ],
      expectedQueryCount: 0,
    },
    {
      signerRes: [
        { performedQueryCount: 0, totalQuota },
        { performedQueryCount: 0, totalQuota },
        { performedQueryCount: 0, totalQuota },
        { performedQueryCount: 1, totalQuota },
      ],
      expectedQueryCount: 0,
    }, // does not reach threshold
    {
      signerRes: [
        { performedQueryCount: 1, totalQuota },
        { performedQueryCount: 1, totalQuota },
        { performedQueryCount: 0, totalQuota },
        { performedQueryCount: 1, totalQuota },
      ],
      expectedQueryCount: 1,
    }, // threshold reached
    {
      signerRes: [
        { performedQueryCount: 0, totalQuota },
        { performedQueryCount: 1, totalQuota },
        { performedQueryCount: 1, totalQuota },
        { performedQueryCount: 1, totalQuota },
      ],
      expectedQueryCount: 1,
    }, // order of signers shouldn't matter
    {
      signerRes: [
        { performedQueryCount: 1, totalQuota },
        { performedQueryCount: 4, totalQuota },
        { performedQueryCount: 9, totalQuota },
        { performedQueryCount: 11, totalQuota },
      ],
      expectedQueryCount: 9,
    },
  ]
  varyingQueryCount.forEach(({ signerRes, expectedQueryCount }) => {
    it(`should return ${expectedQueryCount} performedQueryCount given signer responses of ${signerRes}`, () => {
      const session = getSession(signerRes)
      const thresholdResult = pnpThresholdStateService.findCombinerQuotaState(session)
      expect(thresholdResult).toStrictEqual({
        performedQueryCount: expectedQueryCount,
        totalQuota,
        blockNumber: testBlockNumber,
      })
    })
  })

  const varyingTotalQuota = [
    {
      signerRes: [
        { performedQueryCount, totalQuota },
        { performedQueryCount, totalQuota },
        { performedQueryCount, totalQuota },
        { performedQueryCount, totalQuota },
      ],
      expectedTotalQuota: totalQuota,
      warning: false,
    },
    {
      signerRes: [
        { performedQueryCount, totalQuota: 7 },
        { performedQueryCount, totalQuota: 8 },
        { performedQueryCount, totalQuota: 9 },
        { performedQueryCount, totalQuota: 10 },
      ],
      expectedTotalQuota: 8,
      warning: true,
    },
    {
      signerRes: [
        { performedQueryCount, totalQuota: 8 },
        { performedQueryCount, totalQuota: 9 },
        { performedQueryCount, totalQuota: 10 },
        { performedQueryCount, totalQuota: 7 },
      ],
      expectedTotalQuota: 8,
      warning: true,
    },
  ]
  varyingTotalQuota.forEach(({ signerRes, expectedTotalQuota, warning }) => {
    it(`should return ${expectedTotalQuota} totalQuota given signer responses of ${signerRes}`, () => {
      const session = getSession(signerRes)
      const thresholdResult = pnpThresholdStateService.findCombinerQuotaState(session)
      expect(thresholdResult).toStrictEqual({
        performedQueryCount,
        totalQuota: expectedTotalQuota,
        blockNumber: testBlockNumber,
      })
      if (warning) {
        expect(session.warnings).toContain(
          WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS +
            ', using threshold signer as best guess'
        )
      }
    })
  })

  const varyingQuotaAndQuery = [
    {
      signerRes: [
        { performedQueryCount: 1, totalQuota: 10 },
        { performedQueryCount: 2, totalQuota: 9 },
        { performedQueryCount: 3, totalQuota: 8 },
        { performedQueryCount: 4, totalQuota: 7 },
      ],
      expectedQueryCount: 3,
      expectedTotalQuota: 8,
      warning: true,
    },
    {
      signerRes: [
        { performedQueryCount: 1, totalQuota: 7 },
        { performedQueryCount: 2, totalQuota: 8 },
        { performedQueryCount: 5, totalQuota: 9 },
        { performedQueryCount: 6, totalQuota: 10 },
      ],
      expectedQueryCount: 5,
      expectedTotalQuota: 9,
      warning: true,
    },
  ]
  varyingQuotaAndQuery.forEach(({ signerRes, expectedQueryCount, expectedTotalQuota, warning }) => {
    it(`should return ${expectedTotalQuota} totalQuota and ${expectedQueryCount} performedQueryCount given signer responses of ${signerRes}`, () => {
      const session = getSession(signerRes)
      const thresholdResult = pnpThresholdStateService.findCombinerQuotaState(session)
      expect(thresholdResult).toStrictEqual({
        performedQueryCount: expectedQueryCount,
        totalQuota: expectedTotalQuota,
        blockNumber: testBlockNumber,
      })
      if (warning) {
        expect(session.warnings).toContain(
          WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS +
            ', using threshold signer as best guess'
        )
      }
    })
  })

  it('should throw an error if the total quota varies too much between signers', () => {
    const session = getSession([
      { performedQueryCount, totalQuota: 1 },
      { performedQueryCount, totalQuota: 9 },
      { performedQueryCount, totalQuota: 15 },
      { performedQueryCount, totalQuota: 14 },
    ])
    expect(() => pnpThresholdStateService.findCombinerQuotaState(session)).toThrow(
      WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS
    )
  })
})
