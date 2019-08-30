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
      const UNROUNDED_NUMBER1 = '0.50001'
      const ROUNDED_NUMBER1 = '0.5001'
      expect(roundUp(UNROUNDED_NUMBER1, 4).toString()).toBe(ROUNDED_NUMBER1)
      const UNROUNDED_NUMBER2 = '0.599'
      const ROUNDED_NUMBER2 = '0.6'
      expect(roundUp(UNROUNDED_NUMBER2, 2).toString()).toBe(ROUNDED_NUMBER2)
    })

    it('rounds down', () => {
      const UNROUNDED_NUMBER1 = '0.50001'
      const ROUNDED_NUMBER1 = '0.5'
      expect(roundDown(UNROUNDED_NUMBER1, 4).toString()).toBe(ROUNDED_NUMBER1)
      const UNROUNDED_NUMBER2 = '0.599'
      const ROUNDED_NUMBER2 = '0.59'
      expect(roundDown(UNROUNDED_NUMBER2, 2).toString()).toBe(ROUNDED_NUMBER2)
    })
  })
})
