import { isVersionBelowMinimum } from 'src/utils/versionCheck'
describe('Version check', () => {
  it('Correctly check if version is deprecated', () => {
    expect(isVersionBelowMinimum('1.5.0', '1.4.0')).toBe(false)
    expect(isVersionBelowMinimum('1.4.0', '1.5.0')).toBe(true)
    expect(isVersionBelowMinimum('1.4.0', '1.4.0')).toBe(false)
    expect(isVersionBelowMinimum('1.4.0', '1.4.0.1')).toBe(true)
    expect(isVersionBelowMinimum('1.4.0-unstable', '1.4.0')).toBe(false)
  })
})
