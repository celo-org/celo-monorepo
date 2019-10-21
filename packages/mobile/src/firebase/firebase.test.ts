import { getNestedValue, isDeprecatedVersion } from 'src/firebase/firebase'
import { mockNestedObject } from 'test/values'

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

describe('Nested Object', () => {
  it('Correct get nested value from an object', () => {
    let value = getNestedValue(mockNestedObject, ['1', '2', '3'])
    expect(value).toBe(true)
    value = getNestedValue(mockNestedObject, ['1', '2', '4'])
    expect(value).toBe(false)
    value = getNestedValue(mockNestedObject, ['1', '2', '4', '5'])
    expect(value).toBeUndefined()
  })
})
