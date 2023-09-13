import { KeyVersionInfo, WarningMessage } from '@celo/phone-number-privacy-common'
import { getSignerVersion } from '@celo/phone-number-privacy-signer/src/config'

import config from '../../src/config'
import { findCombinerQuotaState } from '../../src/pnp/services/threshold-state'

describe('pnp threshold state', () => {
  // TODO add tests with failed signer responses, depending on
  // result of https://github.com/celo-org/celo-monorepo/issues/9826

  const keyVersionInfo: KeyVersionInfo = {
    keyVersion: 1,
    threshold: 3,
    polynomial: 'mock polynomial',
    pubKey: 'mock pubKey',
  }

  const pnpConfig = config.phoneNumberPrivacy
  pnpConfig.keys.currentVersion = keyVersionInfo.keyVersion
  pnpConfig.keys.versions = JSON.stringify([keyVersionInfo])

  const expectedVersion = getSignerVersion()
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
      const responses = signerRes.map((o) => {
        return {
          url: 'random url',
          status: 200,
          res: {
            success: true as true,
            version: expectedVersion,
            ...o,
          },
        }
      })

      const warnings: string[] = []
      const thresholdResult = findCombinerQuotaState(keyVersionInfo, responses, warnings)
      expect(thresholdResult).toStrictEqual({
        performedQueryCount: expectedQueryCount,
        totalQuota,
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
      const responses = signerRes.map((o) => {
        return {
          url: 'random url',
          status: 200,
          res: {
            success: true as true,
            version: expectedVersion,
            ...o,
          },
        }
      })

      const warnings: string[] = []
      const thresholdResult = findCombinerQuotaState(keyVersionInfo, responses, warnings)
      expect(thresholdResult).toStrictEqual({
        performedQueryCount,
        totalQuota: expectedTotalQuota,
      })
      if (warning) {
        expect(warnings).toContain(
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
      const responses = signerRes.map((o) => {
        return {
          url: 'random url',
          status: 200,
          res: {
            success: true as true,
            version: expectedVersion,
            ...o,
          },
        }
      })

      const warnings: string[] = []
      const thresholdResult = findCombinerQuotaState(keyVersionInfo, responses, warnings)
      expect(thresholdResult).toStrictEqual({
        performedQueryCount: expectedQueryCount,
        totalQuota: expectedTotalQuota,
      })
      if (warning) {
        expect(warnings).toContain(
          WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS +
            ', using threshold signer as best guess'
        )
      }
    })
  })

  it('should throw an error if the total quota varies too much between signers', () => {
    const signerRes = [
      { performedQueryCount, totalQuota: 1 },
      { performedQueryCount, totalQuota: 9 },
      { performedQueryCount, totalQuota: 15 },
      { performedQueryCount, totalQuota: 14 },
    ]
    const responses = signerRes.map((o) => {
      return {
        url: 'random url',
        status: 200,
        res: {
          success: true as true,
          version: expectedVersion,
          ...o,
        },
      }
    })

    const warnings: string[] = []
    expect(() => findCombinerQuotaState(keyVersionInfo, responses, warnings)).toThrow(
      WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS
    )
  })
})
