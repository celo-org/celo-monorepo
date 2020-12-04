import { stringToBoolean } from './parsing'

test('stringToBoolean()', () => {
  expect(stringToBoolean('true')).toBe(true)
  expect(stringToBoolean('      true    ')).toBe(true)
  expect(stringToBoolean('false')).toBe(false)
  expect(stringToBoolean('      false   ')).toBe(false)

  expect(stringToBoolean('FaLse')).toBe(false)
  expect(stringToBoolean('TruE')).toBe(true)

  expect(() => stringToBoolean('fals')).toThrow("Unable to parse 'fals' as boolean")
})
