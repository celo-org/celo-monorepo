/* Helper functions for converting between stable and gold currencies */
import BigNumber from 'bignumber.js'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM as Tokens } from 'src/geth/consts'
import { getMoneyDisplayValue } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
const TAG = 'utils/currencyExchange'

type numberT = number | string | BigNumber | null

export function getRateForMakerToken(
  exchangeRatePair: ExchangeRatePair | null,
  makerToken: Tokens
) {
  if (!exchangeRatePair) {
    Logger.warn(TAG, `Rate for token ${makerToken} is NaN`)
    return new BigNumber(0)
  }

  let rateBN: BigNumber
  if (makerToken === Tokens.DOLLAR) {
    rateBN = new BigNumber(exchangeRatePair.dollarMaker)
  } else if (makerToken === Tokens.GOLD) {
    rateBN = new BigNumber(exchangeRatePair.goldMaker)
  } else {
    Logger.warn(TAG, `Unexpected token ${makerToken}`)
    throw new Error(`Unexpected token ${makerToken}`)
  }

  if (rateBN.isZero()) {
    Logger.warn(TAG, `Rate for token ${makerToken} is 0`)
    return new BigNumber(0)
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
  Logger.debug(
    TAG + '@getTakerAmount',
    `Exchanging ${amountBN} at rate ${rateBN} gives ${converted}`
  )

  if (decimals !== undefined) {
    converted = converted.decimalPlaces(decimals, BigNumber.ROUND_DOWN)
  }

  return converted
}

export function getNewMakerBalance(previousBalance: string | null, delta: BigNumber) {
  return getMoneyDisplayValue(new BigNumber(previousBalance || 0).minus(delta))
}

export function getNewTakerBalance(previousBalance: string | null, delta: BigNumber) {
  return getMoneyDisplayValue(new BigNumber(previousBalance || 0).plus(delta))
}

export function getNewDollarBalance(
  dollarBalance: string | null,
  makerToken: Tokens,
  makerAmount: BigNumber,
  takerAmount: BigNumber
) {
  return makerToken === Tokens.DOLLAR
    ? getNewMakerBalance(dollarBalance, makerAmount)
    : getNewTakerBalance(dollarBalance, takerAmount)
}

export function getNewGoldBalance(
  goldBalance: string | null,
  makerToken: Tokens,
  makerAmount: BigNumber,
  takerAmount: BigNumber
) {
  return makerToken === Tokens.GOLD
    ? getNewMakerBalance(goldBalance, makerAmount)
    : getNewTakerBalance(goldBalance, takerAmount)
}
