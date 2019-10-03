import { CURRENCY_ENUM } from 'src/geth/consts'
import {
  getCentAwareMoneyDisplay,
  getMoneyDisplayValue,
  getNetworkFeeDisplayValue,
  roundDown,
  roundUp,
} from 'src/utils/formatting'

describe('utils->formatting', () => {
  describe('getMoneyDisplayValue', () => {
    const UNROUNDED_NUMBER = 5.239895
    const ROUNDED_NUMBER_2_DECIMALS = '5.23'
    const ROUNDED_NUMBER_3_DECIMALS = '5.239'

    it('formats correctly for default case', () => {
      expect(getMoneyDisplayValue(UNROUNDED_NUMBER)).toBe(ROUNDED_NUMBER_2_DECIMALS)
    })

    it('formats correctly for dollars', () => {
      expect(getMoneyDisplayValue(UNROUNDED_NUMBER, CURRENCY_ENUM.DOLLAR)).toBe(
        ROUNDED_NUMBER_2_DECIMALS
      )
    })

    it('formats correctly for dollars', () => {
      expect(getMoneyDisplayValue(UNROUNDED_NUMBER, CURRENCY_ENUM.GOLD)).toBe(
        ROUNDED_NUMBER_3_DECIMALS
      )
    })

    it('includes dollar symbol', () => {
      expect(getMoneyDisplayValue(UNROUNDED_NUMBER, CURRENCY_ENUM.DOLLAR, true)).toBe(
        '$' + ROUNDED_NUMBER_2_DECIMALS
      )
    })

    it('includes gold symbol (which is nothing)', () => {
      expect(getMoneyDisplayValue(UNROUNDED_NUMBER, CURRENCY_ENUM.GOLD, true)).toBe(
        ROUNDED_NUMBER_3_DECIMALS
      )
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

  describe('getNetworkFeeDisplayValue', () => {
    it('rounds up for fees smaller than 0.001', () => {
      const BELOW_DISPLAY_THRESHOLD = 0.0000002
      expect(getNetworkFeeDisplayValue(BELOW_DISPLAY_THRESHOLD)).toBe('<0.001')
    })
    it('rounds up for fees smaller than 0.000001 when precise', () => {
      const BELOW_DISPLAY_THRESHOLD = 0.0000002
      expect(getNetworkFeeDisplayValue(BELOW_DISPLAY_THRESHOLD, true)).toBe('<0.000001')
    })
    it('shows right precision below 0.001 when precise', () => {
      const BELOW_ROUNDING_THRESHOLD = 0.00002
      expect(getNetworkFeeDisplayValue(BELOW_ROUNDING_THRESHOLD, true)).toBe('0.00002')
    })
    it('shows right precision above 0.001', () => {
      const ABOVE_ROUNDING_THRESHOLD = 0.1
      expect(getNetworkFeeDisplayValue(ABOVE_ROUNDING_THRESHOLD)).toBe('0.1')
    })

    it('shows right precision above 0.001 when precise', () => {
      const ABOVE_ROUNDING_THRESHOLD = 0.100001
      expect(getNetworkFeeDisplayValue(ABOVE_ROUNDING_THRESHOLD, true)).toBe('0.101')
    })
  })

  describe('rounding', () => {
    it('rounds up', () => {
      expect(roundUp('0.50001', 4).toString()).toBe('0.5001')
      expect(roundUp('0.599', 2).toString()).toBe('0.6')
    })

    it('rounds down', () => {
      expect(roundDown('0.50001', 4).toString()).toBe('0.5')
      expect(roundDown('0.599', 2).toString()).toBe('0.59')
    })
  })
})
