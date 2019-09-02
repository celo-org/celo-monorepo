import {
  getCentAwareMoneyDisplay,
  getMoneyDisplayValue,
  roundDown,
  roundUp,
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
