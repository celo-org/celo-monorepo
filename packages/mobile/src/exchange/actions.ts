import BigNumber from 'bignumber.js'
import { ExchangeRate, ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM } from 'src/geth/consts'

export enum Actions {
  FETCH_EXCHANGE_RATE = 'EXCHANGE/FETCH_EXCHANGE_RATE',
  SET_EXCHANGE_RATE = 'EXCHANGE/SET_EXCHANGE_RATE',
  UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY = 'EXCHANGE/UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY',
  SET_CELO_GOLD_EXCHANGE_RATE_HISTORY = 'SET_CELO_GOLD_EXCHANGE_RATE_HISTORY',
  EXCHANGE_TOKENS = 'EXCHANGE/EXCHANGE_TOKENS',
}

export interface FetchExchangeRateAction {
  type: Actions.FETCH_EXCHANGE_RATE
  makerToken?: CURRENCY_ENUM
  makerAmount?: BigNumber
}

export const fetchExchangeRate = (
  makerToken?: CURRENCY_ENUM,
  makerAmount?: BigNumber
): FetchExchangeRateAction => ({
  type: Actions.FETCH_EXCHANGE_RATE,
  makerToken,
  makerAmount,
})

export interface SetExchangeRateAction {
  type: Actions.SET_EXCHANGE_RATE
  exchangeRatePair: ExchangeRatePair
}

export const setExchangeRate = (exchangeRatePair: ExchangeRatePair): SetExchangeRateAction => ({
  type: Actions.SET_EXCHANGE_RATE,
  exchangeRatePair,
})

export interface UpdateCeloGoldExchangeRateHistory {
  type: Actions.UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY
  exchangeRates: ExchangeRate[]
}

export const updateCeloGoldExchangeRateHistory = (
  exchangeRates: ExchangeRate[]
): UpdateCeloGoldExchangeRateHistory => ({
  type: Actions.UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY,
  exchangeRates,
})

export interface ExchangeTokensAction {
  type: Actions.EXCHANGE_TOKENS
  makerToken: CURRENCY_ENUM
  makerAmount: BigNumber
}

export const exchangeTokens = (
  makerToken: CURRENCY_ENUM,
  makerAmount: BigNumber
): ExchangeTokensAction => ({
  type: Actions.EXCHANGE_TOKENS,
  makerToken,
  makerAmount,
})

export type ActionTypes =
  | SetExchangeRateAction
  | ExchangeTokensAction
  | UpdateCeloGoldExchangeRateHistory
