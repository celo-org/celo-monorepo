import BigNumber from 'bignumber.js'
import { parseInputAmount, stringToBoolean } from '../src/parsing'

describe('utils->parsing', () => {
  it('stringToBoolean', () => {
    expect(stringToBoolean('true')).toBe(true)
    expect(stringToBoolean('false')).toBe(false)

    expect(stringToBoolean('False')).toBe(false)
    expect(stringToBoolean('True')).toBe(true)

    expect(() => stringToBoolean('fals')).toThrow('Parsing error')
  })

  it('stringToBigNum', () => {
    expect(parseInputAmount('.1')).toStrictEqual(new BigNumber('0.1'))
    expect(parseInputAmount('.1 ')).toStrictEqual(new BigNumber('0.1'))
    expect(parseInputAmount('1.')).toStrictEqual(new BigNumber('1'))
    expect(parseInputAmount('0')).toStrictEqual(new BigNumber('0'))
    expect(parseInputAmount('')).toStrictEqual(new BigNumber('0'))
  })
})
