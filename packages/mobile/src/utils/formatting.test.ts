import BigNumber from 'bignumber.js'
import {
  getCentAwareMoneyDisplay,
  getMoneyDisplayValue,
  getMoneyFeeyDisplayValueFromBigNum,
} from 'src/utils/formatting'

describe('utils->formatting', () => {
  describe('getMoneyDisplayValue', () => {
    const UNROUNDED_NUMBER = 5.239895
    const ROUNDED_NUMBER = '5.23'

    it('rounds down correctly', () => {
      expect(getMoneyDisplayValue(UNROUNDED_NUMBER)).toBe(ROUNDED_NUMBER)
    })
  })

  describe('getCentAwareMoneyDisplay', () => {
    const UNROUNDED_NUMBER = 5.239895
    const ROUNDED_NUMBER = '5.23'

    it('shows cents when they matter', () => {
      expect(getCentAwareMoneyDisplay(UNROUNDED_NUMBER)).toBe(ROUNDED_NUMBER)
    })
    it('rounds to dollars when cents are 00', () => {
      expect(getCentAwareMoneyDisplay(500.0)).toBe('500')
    })
    it('it shows both cent digits when it shows any cents', () => {
      expect(getCentAwareMoneyDisplay(500.2)).toBe('500.20')
    })
  })

  describe('fees', () => {
    it('rounds up the fees', () => {
      const UNROUNDED_NUMBER = '0.00046'
      const ROUNDED_NUMBER = '0.0005'
      expect(getMoneyFeeyDisplayValueFromBigNum(new BigNumber(UNROUNDED_NUMBER))).toBe(
        ROUNDED_NUMBER
      )
    })

    it('rounds up a big fees', () => {
      const UNROUNDED_NUMBER = '0.50001'
      const ROUNDED_NUMBER = '0.5001'

      expect(getMoneyFeeyDisplayValueFromBigNum(new BigNumber(UNROUNDED_NUMBER))).toBe(
        ROUNDED_NUMBER
      )
    })
  })
})
