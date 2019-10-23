import { isDeprecatedVersion } from 'src/firebase/firebase'

describe('Firebase version check', () => {
  it('Correctly check if version is deprecated', () => {
    let isDeprecated: boolean = isDeprecatedVersion('1.5.0', '1.4.0')
    expect(isDeprecated).toBe(false)
    isDeprecated = isDeprecatedVersion('1.4.0', '1.5.0')
    expect(isDeprecated).toBe(true)
    isDeprecated = isDeprecatedVersion('1.4.0', '1.4.0')
    expect(isDeprecated).toBe(false)
    isDeprecated = isDeprecatedVersion('1.4.0', '1.4.0.1')
    expect(isDeprecated).toBe(true)
  })
})
