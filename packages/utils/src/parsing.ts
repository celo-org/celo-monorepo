import BigNumber from 'bignumber.js'
const numeral = require('numeral')

export const stringToBoolean = (inputString: string): boolean => {
  const lowercasedInput = inputString.toLowerCase()
  if (lowercasedInput === 'true') {
    return true
  } else if (lowercasedInput === 'false') {
    return false
  }
  throw new Error('Parsing error')
}

export const parseInputAmount = (inputString: string): BigNumber => {
  // Potential precision loss from using numeric values
  // https://github.com/MikeMcl/bignumber.js/#use
  return new BigNumber(numeral(inputString).value() || '0')
}

/**
 * Parses an "array of strings" that is returned from a Solidity function
 *
 * @param stringLengths length of each string in bytes
 * @param data 0x-prefixed, hex-encoded string data in utf-8 bytes
 */
export const parseSolidityStringArray = (stringLengths: number[], data: string) => {
  if (data === null) {
    data = '0x'
  }
  const ret: string[] = []
  let offset = 0
  // @ts-ignore
  const rawData = Buffer.from(data.slice(2), 'hex')
  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < stringLengths.length; i++) {
    const string = rawData.toString('utf-8', offset, offset + stringLengths[i])
    offset += stringLengths[i]
    ret.push(string)
  }
  return ret
}
