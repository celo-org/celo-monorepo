import * as utils from '../../src/utils/input-validation'
import {
  GetBlindedMessageSigRequest,
  GetContactMatchesRequest,
  GetQuotaRequest,
  OdisRequest,
} from '../../src/interfaces'
import { REASONABLE_BODY_CHAR_LIMIT } from '../../src/utils/constants'

describe('Input Validation test suite', () => {
  describe('hasValidIdentifier utility', () => {
    it('Should return false with empty phone number', () => {
      const sampleData: GetContactMatchesRequest = {
        account: 'account',
        contactPhoneNumbers: [],
        userPhoneNumber: 'number',
        hashedPhoneNumber: '',
      }

      const result = utils.hasValidIdentifier(sampleData)

      expect(result).toBeFalsy()
    })

    it('Should return false with non-hex phone number', () => {
      const sampleData: GetContactMatchesRequest = {
        account: 'account',
        contactPhoneNumbers: [],
        userPhoneNumber: 'number',
        hashedPhoneNumber: '0xTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTEST',
      }

      const result = utils.hasValidIdentifier(sampleData)

      expect(result).toBeFalsy()
    })

    it('Should return true with hex phone number', () => {
      const sampleData: GetContactMatchesRequest = {
        account: 'account',
        contactPhoneNumbers: [],
        userPhoneNumber: 'number',
        hashedPhoneNumber: '0x0000123400001234000012340000123400001234000012340000123400001234',
      }

      const result = utils.hasValidIdentifier(sampleData)

      expect(result).toBeTruthy()
    })
  })

  describe('identifierIsValidIfExists utility', () => {
    it('Should return true with empty phone number', () => {
      const sampleData: GetContactMatchesRequest = {
        account: 'account',
        contactPhoneNumbers: [],
        userPhoneNumber: 'number',
        hashedPhoneNumber: '',
      }

      const result = utils.identifierIsValidIfExists(sampleData)

      expect(result).toBeTruthy()
    })

    it('Should return true with valid phone number', () => {
      const sampleData: GetContactMatchesRequest = {
        account: 'account',
        contactPhoneNumbers: [],
        userPhoneNumber: 'number',
        hashedPhoneNumber: '0x0000123400001234000012340000123400001234000012340000123400001234',
      }

      const result = utils.identifierIsValidIfExists(sampleData)

      expect(result).toBeTruthy()
    })
  })

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
      const sampleData: OdisRequest = {
        account: '0xc1912fee45d61c87cc5ea59dae31190fffff232d',
      }

      const result = utils.hasValidAccountParam(sampleData)

      expect(result).toBeTruthy()
    })

    it('Should return false for nonsense address', () => {
      const sampleData: OdisRequest = {
        account: '0xAA',
      }

      const result = utils.hasValidAccountParam(sampleData)

      expect(result).toBeFalsy()
    })

    it('Should return false with missing address', () => {
      const sampleData: OdisRequest = {
        account: '',
      }

      const result = utils.hasValidAccountParam(sampleData)

      expect(result).toBeFalsy()
    })
  })

  describe('hasValidUserPhoneNumberParam utility', () => {
    it('Should return true for proper phone number', () => {
      const sampleData: GetContactMatchesRequest = {
        userPhoneNumber: Buffer.from('1912fee45d61c87cc5ea59dae31190ff').toString('base64'),
        hashedPhoneNumber: 'hash',
        contactPhoneNumbers: [],
        account: '',
      }

      const result = utils.hasValidUserPhoneNumberParam(sampleData)

      expect(result).toBeTruthy()
    })

    it('Should return false with wrong phone number', () => {
      const sampleData: GetContactMatchesRequest = {
        userPhoneNumber: Buffer.from('z').toString('base64'),
        hashedPhoneNumber: 'hash',
        contactPhoneNumbers: [],
        account: '',
      }

      const result = utils.hasValidUserPhoneNumberParam(sampleData)

      expect(result).toBeFalsy()
    })
  })

  describe('hasValidContactPhoneNumbersParam utility', () => {
    it('Should return true for proper contact phone numbers', () => {
      const sampleData: GetContactMatchesRequest = {
        userPhoneNumber: 'phone',
        hashedPhoneNumber: 'hash',
        contactPhoneNumbers: [Buffer.from('1912fee45d61c87cc5ea59dae31190ff').toString('base64')],
        account: '',
      }

      const result = utils.hasValidContactPhoneNumbersParam(sampleData)

      expect(result).toBeTruthy()
    })

    it('Should return false for wrong contact phone number', () => {
      const sampleData: GetContactMatchesRequest = {
        userPhoneNumber: 'phone',
        hashedPhoneNumber: 'hash',
        contactPhoneNumbers: [Buffer.from('zz').toString('base64')],
        account: '',
      }

      const result = utils.hasValidContactPhoneNumbersParam(sampleData)

      expect(result).toBeFalsy()
    })

    it('Should return false for missing contact phone number', () => {
      const sampleData: GetContactMatchesRequest = {
        userPhoneNumber: 'phone',
        hashedPhoneNumber: 'hash',
        contactPhoneNumbers: [],
        account: '',
      }

      const result = utils.hasValidContactPhoneNumbersParam(sampleData)

      expect(result).toBeFalsy()
    })
  })

  describe('hasValidBlindedPhoneNumberParam utility', () => {
    it('Should return true for blinded query', () => {
      const sampleData: GetBlindedMessageSigRequest = {
        blindedQueryPhoneNumber: Buffer.from(
          '1912fee45d61c87cc5ea59dae31190ff1912fee45d61c8'
        ).toString('base64'),
        account: 'acc',
      }

      const result = utils.hasValidBlindedPhoneNumberParam(sampleData)

      expect(result).toBeTruthy()
    })

    it('Should return false for not base64 query', () => {
      const sampleData: GetBlindedMessageSigRequest = {
        blindedQueryPhoneNumber: Buffer.from(
          'JanAdamMickiewicz1234!@JanAdamMickiewicz1234!@123412345678901234'
        ).toString('utf-8'),
        account: 'acc',
      }

      const result = utils.hasValidBlindedPhoneNumberParam(sampleData)

      expect(result).toBeFalsy()
    })

    it('Should return false for too short blinded query', () => {
      const sampleData: GetBlindedMessageSigRequest = {
        blindedQueryPhoneNumber: Buffer.from('1912fee45d61c87cc5e').toString('base64'),
        account: 'acc',
      }

      const result = utils.hasValidBlindedPhoneNumberParam(sampleData)

      expect(result).toBeFalsy()
    })

    it('Should return false for missing param in query', () => {
      const sampleData: GetBlindedMessageSigRequest = {
        blindedQueryPhoneNumber: '',
        account: 'acc',
      }

      const result = utils.hasValidBlindedPhoneNumberParam(sampleData)

      expect(result).toBeFalsy()
    })
  })
})
