import BigNumber from 'bignumber.js'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM } from 'src/geth/consts'

export enum Actions {
  FETCH_EXCHANGE_RATE = 'EXCHANGE/FETCH_EXCHANGE_RATE',
  SET_EXCHANGE_RATE = 'EXCHANGE/SET_EXCHANGE_RATE',
  EXCHANGE_TOKENS = 'EXCHANGE/EXCHANGE_TOKENS',
  FETCH_TOBIN_TAX = 'EXCHANGE/FETCH_TOBIN_TAX',
  SET_TOBIN_TAX = 'EXCHANGE/SET_TOBIN_TAX',
}

export interface SetExchangeRateAction {
  type: Actions.SET_EXCHANGE_RATE
  exchangeRatePair: ExchangeRatePair
}

export interface SetTobinTaxAction {
  type: Actions.SET_TOBIN_TAX
  tobinTax: string
}

export interface ExchangeTokensAction {
  type: Actions.EXCHANGE_TOKENS
  makerToken: CURRENCY_ENUM
  makerAmount: BigNumber
}

export const fetchExchangeRate = (makerAmount?: BigNumber, makerToken?: CURRENCY_ENUM) => ({
  type: Actions.FETCH_EXCHANGE_RATE,
  makerAmount,
  makerToken,
})

export const setExchangeRate = (exchangeRatePair: ExchangeRatePair): SetExchangeRateAction => ({
  type: Actions.SET_EXCHANGE_RATE,
  exchangeRatePair,
})

export const fetchTobinTax = () => ({ type: Actions.FETCH_TOBIN_TAX })

export const setTobinTax = (tobinTax: string): SetTobinTaxAction => ({
  type: Actions.SET_TOBIN_TAX,
  tobinTax,
})

export const exchangeTokens = (
  makerToken: CURRENCY_ENUM,
  makerAmount: BigNumber
): ExchangeTokensAction => ({
  type: Actions.EXCHANGE_TOKENS,
  makerToken,
  makerAmount,
})
export type ActionTypes = SetExchangeRateAction | ExchangeTokensAction | SetTobinTaxAction
