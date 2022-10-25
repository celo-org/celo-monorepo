import { GetQuotaRequest, LegacySignMessageRequest } from '../../src/interfaces'
import { REASONABLE_BODY_CHAR_LIMIT } from '../../src/utils/constants'
import * as utils from '../../src/utils/input-validation'

describe('Input Validation test suite', () => {
  describe('isBodyReasonablySized utility', () => {
    it('Should return true with small body', () => {
      const sampleData: GetQuotaRequest = {
        account: 'account',
        hashedPhoneNumber: 'x'.repeat(10),
      }

      const result = utils.isBodyReasonablySized(sampleData)

      expect(result).toBeTruthy()
    })

    it('Should return false with giant body', () => {
      const sampleData: GetQuotaRequest = {
        account: 'account',
        hashedPhoneNumber: 'x'.repeat(REASONABLE_BODY_CHAR_LIMIT * 2),
      }

      const result = utils.isBodyReasonablySized(sampleData)

      expect(result).toBeFalsy()
    })
  })

  describe('hasValidAccountParam utility', () => {
    it('Should return true for proper address', () => {
      const sampleData = {
        account: '0xc1912fee45d61c87cc5ea59dae31190fffff232d',
      }

      const result = utils.hasValidAccountParam(sampleData)

      expect(result).toBeTruthy()
    })

    it('Should return false for nonsense address', () => {
      const sampleData = {
        account: '0xAA',
      }

      const result = utils.hasValidAccountParam(sampleData)

      expect(result).toBeFalsy()
    })

    it('Should return false with missing address', () => {
      const sampleData = {
        account: '',
      }

      const result = utils.hasValidAccountParam(sampleData)

      expect(result).toBeFalsy()
    })
  })

  describe('hasValidBlindedPhoneNumberParam utility', () => {
    it('Should return true for blinded query', () => {
      const sampleData: LegacySignMessageRequest = {
        blindedQueryPhoneNumber: Buffer.from(
          '1912fee45d61c87cc5ea59dae31190ff1912fee45d61c8'
        ).toString('base64'),
        account: 'acc',
      }

      const result = utils.hasValidBlindedPhoneNumberParam(sampleData)

      expect(result).toBeTruthy()
    })

    it('Should return false for not base64 query', () => {
      const sampleData: LegacySignMessageRequest = {
        blindedQueryPhoneNumber: Buffer.from(
          'JanAdamMickiewicz1234!@JanAdamMickiewicz1234!@123412345678901234'
        ).toString('utf-8'),
        account: 'acc',
      }

      const result = utils.hasValidBlindedPhoneNumberParam(sampleData)

      expect(result).toBeFalsy()
    })

    it('Should return false for too short blinded query', () => {
      const sampleData: LegacySignMessageRequest = {
        blindedQueryPhoneNumber: Buffer.from('1912fee45d61c87cc5e').toString('base64'),
        account: 'acc',
      }

      const result = utils.hasValidBlindedPhoneNumberParam(sampleData)

      expect(result).toBeFalsy()
    })

    it('Should return false for missing param in query', () => {
      const sampleData: LegacySignMessageRequest = {
        blindedQueryPhoneNumber: '',
        account: 'acc',
      }

      const result = utils.hasValidBlindedPhoneNumberParam(sampleData)

      expect(result).toBeFalsy()
    })
  })
})
