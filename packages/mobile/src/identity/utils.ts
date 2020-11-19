import { Address } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'

export function isUserBalanceSufficient(
  userBalance: string | number | null,
  estimatedTxAmount: number | string
) {
  if (!userBalance || new BigNumber(userBalance).isLessThan(new BigNumber(estimatedTxAmount))) {
    return false
  }

  return true
}

export const removeKeyFromMapping = (mapping: { [key: string]: string }, keyToRemove: string) => {
  const newMapping: { [key: string]: string } = {}
  for (const [key, value] of Object.entries(mapping)) {
    if (key !== keyToRemove) {
      newMapping[key] = value
    }
  }
  return newMapping
}

export function hashAddressToSingleDigit(address: Address): number {
  return new BigNumber(address.toLowerCase()).modulo(10).toNumber()
}

export function extractShortSecurityCodeMessage(message: string) {
  const matches = message.match('\\s(\\d{8})\\s')
  if (matches && matches.length === 2) {
    return matches[1]
  }
  return null
}
