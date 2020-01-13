import BigNumber from 'bignumber.js'
import { getExchangeRatePair } from 'src/exchange/selectors'
import { CURRENCY_ENUM } from 'src/geth/consts'
import useSelector from 'src/redux/useSelector'
import { getRateForMakerToken, goldToDollarAmount } from 'src/utils/currencyExchange'

export function useExchangeRate() {
  return getRateForMakerToken(
    useSelector(getExchangeRatePair),
    CURRENCY_ENUM.DOLLAR,
    CURRENCY_ENUM.GOLD
  )
}

export function useGoldToDollarAmount(amount: BigNumber.Value) {
  const exchangeRate = useExchangeRate()
  return goldToDollarAmount(amount, exchangeRate)
}
