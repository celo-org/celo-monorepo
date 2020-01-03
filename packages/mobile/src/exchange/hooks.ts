import BigNumber from 'bignumber.js'
import { getExchangeRatePair } from 'src/exchange/selectors'
import { CURRENCY_ENUM } from 'src/geth/consts'
import useSelector from 'src/redux/useSelector'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'

export function useExchangeRate() {
  return getRateForMakerToken(
    useSelector(getExchangeRatePair),
    CURRENCY_ENUM.DOLLAR,
    CURRENCY_ENUM.GOLD
  )
}

export function useGoldToDollarAmount(amount: number | string | BigNumber | null) {
  const exchangeRate = useExchangeRate()
  const isRateValid = !exchangeRate.isZero() && exchangeRate.isFinite()
  if (!isRateValid) {
    return null
  }

  const convertedAmount = getTakerAmount(amount, exchangeRate)
  if (!convertedAmount) {
    return null
  }

  return convertedAmount
}
