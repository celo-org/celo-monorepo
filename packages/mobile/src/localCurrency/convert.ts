import BigNumber from 'bignumber.js'

export function convertDollarsToLocalAmount(
  amount: BigNumber.Value | null,
  exchangeRate: number | null | undefined
) {
  if (!amount || !exchangeRate) {
    return null
  }

  return new BigNumber(amount).multipliedBy(exchangeRate)
}

export function convertLocalAmountToDollars(
  amount: BigNumber.Value | null,
  exchangeRate: number | null | undefined
) {
  if (!amount || !exchangeRate) {
    return null
  }

  return new BigNumber(amount).dividedBy(exchangeRate)
}
