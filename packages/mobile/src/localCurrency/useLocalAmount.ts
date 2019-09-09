import BigNumber from 'bignumber.js'
import useSelector from 'src/redux/useSelector'

export function useDollarsToLocalAmount(amount: BigNumber.Value | null) {
  const exchangeRate = useSelector((state) => state.localCurrency.exchangeRate)

  if (!amount || !exchangeRate) {
    return null
  }

  return new BigNumber(amount).multipliedBy(exchangeRate).toString()
}

export function useLocalAmountToDollars(amount: BigNumber.Value | null) {
  const exchangeRate = useSelector((state) => state.localCurrency.exchangeRate)

  if (!amount || !exchangeRate) {
    return null
  }

  return new BigNumber(amount).dividedBy(exchangeRate).toString()
}
