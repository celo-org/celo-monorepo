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
