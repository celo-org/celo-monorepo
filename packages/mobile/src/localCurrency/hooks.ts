import BigNumber from 'bignumber.js'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'

export function useExchangeRate() {
  return useSelector(getLocalCurrencyExchangeRate)
}

export function useDollarsToLocalAmount(amount: BigNumber.Value | null) {
  const exchangeRate = useExchangeRate()
  const convertedAmount = convertDollarsToLocalAmount(amount, exchangeRate)
  if (!convertedAmount) {
    return null
  }

  return convertedAmount.toString()
}
