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
