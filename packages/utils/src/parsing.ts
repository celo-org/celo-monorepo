import BigNumber from 'bignumber.js'
const numeral = require('numeral')

export const stringToBoolean = (inputString: string): boolean => {
  const lowercasedInput = inputString.toLowerCase()
  if (lowercasedInput === 'true') {
    return true
  } else if (lowercasedInput === 'false') {
    return false
  }
  throw 'Parsing error'
}

export const parseInputAmount = (inputString: string): BigNumber => {
  // Potential precision loss from using numeric values
  // https://github.com/MikeMcl/bignumber.js/#use
  return new BigNumber(numeral(inputString).value() || '0')
}
