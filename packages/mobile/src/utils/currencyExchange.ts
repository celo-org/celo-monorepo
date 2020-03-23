/* Helper functions for converting between stable and gold currencies */
import BigNumber from 'bignumber.js'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM } from 'src/geth/consts'
import Logger from 'src/utils/Logger'
const TAG = 'utils/currencyExchange'

type numberT = number | string | BigNumber | null

export function getRateForMakerToken(
  exchangeRatePair: ExchangeRatePair | null,
  makerToken: CURRENCY_ENUM,
  inputToken?: CURRENCY_ENUM // Token to convert from, defaults to makerToken
) {
  if (!exchangeRatePair) {
    return new BigNumber(0)
  }

  let rateBN: BigNumber
  if (makerToken === CURRENCY_ENUM.DOLLAR) {
    rateBN = new BigNumber(exchangeRatePair.dollarMaker)
  } else if (makerToken === CURRENCY_ENUM.GOLD) {
    rateBN = new BigNumber(exchangeRatePair.goldMaker)
  } else {
    Logger.warn(TAG, `Unexpected token ${makerToken}`)
    throw new Error(`Unexpected token ${makerToken}`)
  }

  if (rateBN.isZero()) {
    Logger.warn(TAG, `Rate for token ${makerToken} is 0`)
    return new BigNumber(0)
  }

  if (inputToken && inputToken !== makerToken) {
    rateBN = rateBN.pow(-1) // Invert for takerToken -> makerToken rate
  }

  return rateBN
}

export function getTakerAmount(makerAmount: numberT, exchangeRate: numberT, decimals?: number) {
  const amountBN: BigNumber = new BigNumber(makerAmount || 0)
  const rateBN: BigNumber = new BigNumber(exchangeRate || 0)

  if (amountBN.isNaN() || rateBN.isNaN()) {
    Logger.warn(TAG, 'Amount or rate is NaN')
    return new BigNumber(0)
  }

  let converted = amountBN.dividedBy(rateBN)
  if (decimals !== undefined) {
    converted = converted.decimalPlaces(decimals, BigNumber.ROUND_DOWN)
  }

  return converted
}

export function getNewMakerBalance(previousBalance: string | null, delta: BigNumber) {
  return new BigNumber(previousBalance || 0).minus(delta)
}

export function getNewTakerBalance(previousBalance: string | null, delta: BigNumber) {
  return new BigNumber(previousBalance || 0).plus(delta)
}

export function getNewDollarBalance(
  dollarBalance: string | null,
  makerToken: CURRENCY_ENUM,
  makerAmount: BigNumber,
  takerAmount: BigNumber
) {
  return makerToken === CURRENCY_ENUM.DOLLAR
    ? getNewMakerBalance(dollarBalance, makerAmount)
    : getNewTakerBalance(dollarBalance, takerAmount)
}

export function getNewGoldBalance(
  goldBalance: string | null,
  makerToken: CURRENCY_ENUM,
  makerAmount: BigNumber,
  takerAmount: BigNumber
) {
  return makerToken === CURRENCY_ENUM.GOLD
    ? getNewMakerBalance(goldBalance, makerAmount)
    : getNewTakerBalance(goldBalance, takerAmount)
}

export function goldToDollarAmount(amount: BigNumber.Value, exchangeRate: BigNumber | null) {
  const isRateValid = exchangeRate && !exchangeRate.isZero() && exchangeRate.isFinite()
  if (!isRateValid) {
    return null
  }

  const convertedAmount = getTakerAmount(new BigNumber(amount), exchangeRate)
  if (!convertedAmount) {
    return null
  }

  return convertedAmount
}
