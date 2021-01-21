import { compareVersion, isVersionBelowMinimum, isVersionInRange } from 'src/utils/versionCheck'

describe(compareVersion, () => {
  it('correctly compare versions', () => {
    expect(compareVersion('0.20.7', '0.20.8')).toBe(-1)
    expect(compareVersion('0.20.9', '0.20.8')).toBe(1)
    expect(compareVersion('0.20.08', '0.20.8')).toBe(0)
    expect(compareVersion('0.20.08', '0.20.8.1')).toBe(-1)
    expect(compareVersion('0.20.8.1', '0.20.8')).toBe(1)
    expect(compareVersion('0.020', '0.20')).toBe(0)
    expect(compareVersion('0.020-unstable', '0.20')).toBe(0)
  })
})

describe(isVersionBelowMinimum, () => {
  it('checks the version is below the minimum', () => {
    expect(isVersionBelowMinimum('1.5.0', '1.4.0')).toBe(false)
    expect(isVersionBelowMinimum('1.4.0', '1.5.0')).toBe(true)
    expect(isVersionBelowMinimum('1.4.0', '1.4.0')).toBe(false)
    expect(isVersionBelowMinimum('1.4.0', '1.4.0.1')).toBe(true)
    expect(isVersionBelowMinimum('1.4.0-unstable', '1.4.0')).toBe(false)
  })
})

describe(isVersionInRange, () => {
  it('checks the version is in the provided range', () => {
    expect(isVersionInRange('1.5.0', '1.5.0', '1.6.0')).toBe(true)
    expect(isVersionInRange('1.4.10', '1.5.0', '1.6.0')).toBe(false)
    expect(isVersionInRange('1.6.0', '1.5.0', '1.6.0')).toBe(true)
    expect(isVersionInRange('1.6.1', '1.5.0', '1.6.0')).toBe(false)

    // Check when maxVersion is undefined
    expect(isVersionInRange('1.5.0', '1.5.0', undefined)).toBe(true)
    expect(isVersionInRange('1.5.1', '1.5.0', undefined)).toBe(true)
    expect(isVersionInRange('1.4.10', '1.5.0', undefined)).toBe(false)

    // Check when minVersion is undefined
    expect(isVersionInRange('1.5.0', undefined, '1.5.0')).toBe(true)
    expect(isVersionInRange('1.5.1', undefined, '1.5.0')).toBe(false)
    expect(isVersionInRange('1.4.10', undefined, '1.5.0')).toBe(true)

    // Check when both minVersion and maxVersion are undefined
    expect(isVersionInRange('1.5.0', undefined, undefined)).toBe(true)
    expect(isVersionInRange('1.6.0', undefined, undefined)).toBe(true)
    expect(isVersionInRange('1.4.10', undefined, undefined)).toBe(true)
  })
})
