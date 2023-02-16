import { isE164Number } from './phoneNumbers'

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
  VALID_LR: '881551952',
  FORMATTED_AR: '+5491126431111',
  FORMATTED_MX: '+523312345678',
  FORMATTED_LR: '+231881551952',
  DISPLAY_AR: '9 11 2643-1111',
  DISPLAY_MX: '33 1234 5678',
  DISPLAY_LR: '88 155 1952',
  INVALID_EMPTY: '',
  TOO_SHORT: '123',
  VALID_E164: '+141555544444',
}

describe('Phone number formatting and utilities', () => {
  describe('Other phone helper methods', () => {
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
