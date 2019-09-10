import {
  getCountryCode,
  getDisplayPhoneNumber,
  getE164Number,
  getRegionCode,
  getRegionCodeFromCountryCode,
  isE164Number,
  parsePhoneNumber,
} from './phoneNumbers'

const COUNTRY_CODES = {
  US: '+1',
  DE: '+49',
  AR: '+54',
  MX: '+52',
}

const TEST_PHONE_NUMBERS = {
  VALID_US_1: '6282287826',
  VALID_US_2: '(628) 228-7826',
  VALID_US_3: '+16282287826',
  VALID_US_4: '16282287826',
  VALID_DE_1: '015229355106',
  VALID_DE_2: '01522 (935)-5106',
  VALID_DE_3: '+49 01522 935 5106',
  VALID_AR_1: '091126431111',
  VALID_AR_2: '(911) 2643-1111',
  VALID_AR_3: '+5411 2643-1111',
  VALID_AR_4: '9 11 2643 1111',
  VALID_MX_1: '33 1234-5678',
  VALID_MX_2: '1 33 1234-5678',
  VALID_MX_3: '+52 1 33 1234-5678',
  FORMATTED_AR: '+5491126431111',
  FORMATTED_MX: '+523312345678',
  DISPLAY_AR: '9 11 2643-1111',
  DISPLAY_MX: '33 1234 5678',
  INVALID_EMPTY: '',
  TOO_SHORT: '123',
}

describe('Phone number formatting and utilities', () => {
  describe('E164 formatting', () => {
    it('Invalid empty', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.INVALID_EMPTY, COUNTRY_CODES.US)).toBe(null)
    })
    it('Format US phone simple, no country code', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_US_1, COUNTRY_CODES.US)).toBe('+16282287826')
    })
    it('Format US phone messy, no country code', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_US_2, COUNTRY_CODES.US)).toBe('+16282287826')
    })
    it('Format US phone simple, with country code and wrong region', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_US_3, COUNTRY_CODES.AR)).toBe('+16282287826')
    })
    it('Format US phone simple, with country code no plus', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_US_4, COUNTRY_CODES.US)).toBe('+16282287826')
    })
    it('Format DE phone simple, no country code', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_DE_1, COUNTRY_CODES.DE)).toBe('+4915229355106')
    })
    it('Format DE phone messy, no country code', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_DE_2, COUNTRY_CODES.DE)).toBe('+4915229355106')
    })
    it('Format DE phone messy, wrong country code', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_DE_2, COUNTRY_CODES.US)).toBe(null)
    })
    it('Format DE phone with country code', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_DE_3, COUNTRY_CODES.DE)).toBe('+4915229355106')
    })
    it('Format AR phone simple, no country code', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_AR_1, COUNTRY_CODES.AR)).toBe(
        TEST_PHONE_NUMBERS.FORMATTED_AR
      )
    })
    it('Format AR phone messy, no country code', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_AR_2, COUNTRY_CODES.AR)).toBe(
        TEST_PHONE_NUMBERS.FORMATTED_AR
      )
    })
    it('Format AR phone with country code', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_AR_3, COUNTRY_CODES.AR)).toBe(
        TEST_PHONE_NUMBERS.FORMATTED_AR
      )
    })

    it('Format MX phone simple, no country code', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_MX_1, COUNTRY_CODES.MX)).toBe(
        TEST_PHONE_NUMBERS.FORMATTED_MX
      )
    })
    it('Format MX phone simple with 1, no country code', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_MX_2, COUNTRY_CODES.MX)).toBe(
        TEST_PHONE_NUMBERS.FORMATTED_MX
      )
    })
    it('Format MX phone with country code', () => {
      expect(getE164Number(TEST_PHONE_NUMBERS.VALID_MX_3, COUNTRY_CODES.MX)).toBe(
        TEST_PHONE_NUMBERS.FORMATTED_MX
      )
    })
  })

  describe('Display formatting', () => {
    it('Invalid empty', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.INVALID_EMPTY, COUNTRY_CODES.US)).toBe('')
    })
    it('Format US phone simple, no country code', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_US_1, COUNTRY_CODES.US)).toBe(
        '(628) 228-7826'
      )
    })
    it('Format US phone messy, no country code', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_US_2, COUNTRY_CODES.US)).toBe(
        '(628) 228-7826'
      )
    })
    it('Format US phone simple, with country code and wrong region', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_US_3, COUNTRY_CODES.AR)).toBe(
        '(628) 228-7826'
      )
    })
    it('Format US phone simple, with country code but no param', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_US_3, COUNTRY_CODES.US)).toBe(
        '(628) 228-7826'
      )
    })
    it('Format US phone simple, with country code no plus', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_US_4, COUNTRY_CODES.US)).toBe(
        '(628) 228-7826'
      )
    })
    it('Format DE phone simple, no country code', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_DE_1, COUNTRY_CODES.DE)).toBe(
        '01522 9355106'
      )
    })
    it('Format DE phone messy, no country code', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_DE_2, COUNTRY_CODES.DE)).toBe(
        '01522 9355106'
      )
    })
    it('Format DE phone messy, wrong country code', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_DE_2, COUNTRY_CODES.US)).toBe(
        TEST_PHONE_NUMBERS.VALID_DE_2
      )
    })
    it('Format DE phone with country code', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_DE_3, COUNTRY_CODES.DE)).toBe(
        '01522 9355106'
      )
    })
    it('Format AR phone simple, no country code', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_AR_1, COUNTRY_CODES.AR)).toBe(
        TEST_PHONE_NUMBERS.DISPLAY_AR
      )
    })
    it('Format AR phone messy, no country code', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_AR_2, COUNTRY_CODES.AR)).toBe(
        TEST_PHONE_NUMBERS.DISPLAY_AR
      )
    })
    it('Format AR phone with country code', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_AR_3, COUNTRY_CODES.AR)).toBe(
        TEST_PHONE_NUMBERS.DISPLAY_AR
      )
    })

    it('Format MX phone with country code', () => {
      expect(getDisplayPhoneNumber(TEST_PHONE_NUMBERS.VALID_MX_3, COUNTRY_CODES.MX)).toBe(
        TEST_PHONE_NUMBERS.DISPLAY_MX
      )
    })
  })

  describe('Number Parsing', () => {
    it('Invalid empty', () => {
      expect(parsePhoneNumber(TEST_PHONE_NUMBERS.INVALID_EMPTY, COUNTRY_CODES.US)).toBe(null)
    })
    it('Too short', () => {
      expect(parsePhoneNumber(TEST_PHONE_NUMBERS.TOO_SHORT, COUNTRY_CODES.US)).toBe(null)
    })
    it('Format US messy phone #', () => {
      expect(parsePhoneNumber(TEST_PHONE_NUMBERS.VALID_US_2, COUNTRY_CODES.US)).toMatchObject({
        e164Number: '+16282287826',
        displayNumber: '(628) 228-7826',
        countryCode: 1,
        regionCode: 'US',
      })
    })
    it('Format DE messy phone #', () => {
      expect(parsePhoneNumber(TEST_PHONE_NUMBERS.VALID_DE_2, COUNTRY_CODES.DE)).toMatchObject({
        e164Number: '+4915229355106',
        displayNumber: '01522 9355106',
        countryCode: 49,
        regionCode: 'DE',
      })
    })
    it('Format AR messy phone # 1', () => {
      expect(parsePhoneNumber(TEST_PHONE_NUMBERS.VALID_AR_4, COUNTRY_CODES.AR)).toMatchObject({
        e164Number: TEST_PHONE_NUMBERS.FORMATTED_AR,
        displayNumber: TEST_PHONE_NUMBERS.DISPLAY_AR,
        countryCode: 54,
        regionCode: 'AR',
      })
    })

    it('Format MX phone # 1', () => {
      expect(parsePhoneNumber(TEST_PHONE_NUMBERS.VALID_MX_1, COUNTRY_CODES.MX)).toMatchObject({
        e164Number: TEST_PHONE_NUMBERS.FORMATTED_MX,
        displayNumber: TEST_PHONE_NUMBERS.DISPLAY_MX,
        countryCode: 52,
        regionCode: 'MX',
      })
    })
  })

  describe('Other phone helper methods', () => {
    it('gets country code', () => {
      expect(getCountryCode(TEST_PHONE_NUMBERS.VALID_US_3)).toBe(1)
      expect(getCountryCode(TEST_PHONE_NUMBERS.VALID_DE_3)).toBe(49)
      expect(getCountryCode(TEST_PHONE_NUMBERS.VALID_AR_3)).toBe(54)
    })

    it('gets region code', () => {
      expect(getRegionCode(TEST_PHONE_NUMBERS.VALID_US_3)).toBe('US')
      expect(getRegionCode(TEST_PHONE_NUMBERS.VALID_DE_3)).toBe('DE')
      expect(getRegionCode(TEST_PHONE_NUMBERS.VALID_AR_3)).toBe('AR')
    })

    it('gets region code from country code', () => {
      expect(getRegionCodeFromCountryCode(COUNTRY_CODES.US)).toBe('US')
      expect(getRegionCodeFromCountryCode(COUNTRY_CODES.DE)).toBe('DE')
      expect(getRegionCodeFromCountryCode(COUNTRY_CODES.AR)).toBe('AR')
    })

    it('checks if number is e164', () => {
      // @ts-ignore
      expect(isE164Number(null)).toBe(false)
      expect(isE164Number('')).toBe(false)
      expect(isE164Number(TEST_PHONE_NUMBERS.VALID_US_1)).toBe(false)
      expect(isE164Number(TEST_PHONE_NUMBERS.VALID_US_2)).toBe(false)
      expect(isE164Number(TEST_PHONE_NUMBERS.VALID_US_3)).toBe(true)
      expect(isE164Number(TEST_PHONE_NUMBERS.VALID_US_4)).toBe(false)
    })
  })
})
