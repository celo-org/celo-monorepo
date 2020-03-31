import { isJurisdictionRestricted } from './countries'

describe('isJurisdictionRestricted', () => {
  describe('when given "us"', () => {
    it('returns true', () => {
      expect(isJurisdictionRestricted('us')).toEqual(true)
    })
  })
  describe('when given "uk"', () => {
    it('returns false', () => {
      expect(isJurisdictionRestricted('uk')).toEqual(false)
    })
  })
  describe('when given empty string', () => {
    it('returns true', () => {
      expect(isJurisdictionRestricted('')).toEqual(true)
    })
  })
})
