import * as base from '@celo/base/lib/parsing'
import BigNumber from 'bignumber.js'

// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
export import stringToBoolean = base.stringToBoolean
export import parseSolidityStringArray = base.parseSolidityStringArray

export const parseInputAmount = (inputString: string, decimalSeparator = '.'): BigNumber => {
  if (decimalSeparator !== '.') {
    inputString = inputString.replace(decimalSeparator, '.')
  }
  return new BigNumber(inputString || '0')
}
