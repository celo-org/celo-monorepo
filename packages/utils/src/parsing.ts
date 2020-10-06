import BigNumber from 'bignumber.js'

// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
export { parseSolidityStringArray, stringToBoolean } from '@celo/base/lib/parsing'

export const parseInputAmount = (inputString: string, decimalSeparator = '.'): BigNumber => {
  if (decimalSeparator !== '.') {
    inputString = inputString.replace(decimalSeparator, '.')
  }
  return new BigNumber(inputString || '0')
}
