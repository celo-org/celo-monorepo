import BigNumber from 'bignumber.js'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ExchangeRate, ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM } from 'src/geth/consts'

export enum Actions {
  FETCH_EXCHANGE_RATE = 'EXCHANGE/FETCH_EXCHANGE_RATE',
  SET_EXCHANGE_RATE = 'EXCHANGE/SET_EXCHANGE_RATE',
  UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY = 'EXCHANGE/UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY',
  SET_CELO_GOLD_EXCHANGE_RATE_HISTORY = 'SET_CELO_GOLD_EXCHANGE_RATE_HISTORY',
  EXCHANGE_TOKENS = 'EXCHANGE/EXCHANGE_TOKENS',
  FETCH_TOBIN_TAX = 'EXCHANGE/FETCH_TOBIN_TAX',
  SET_TOBIN_TAX = 'EXCHANGE/SET_TOBIN_TAX',
  WITHDRAW_CELO = 'EXCHANGE/WITHDRAW_CELO',
  WITHDRAW_CELO_SUCCESS = 'EXCHANGE/WITHDRAW_CELO_SUCCESS',
  WITHDRAW_CELO_FAILED = 'EXCHANGE/WITHDRAW_CELO_FAILED',
}

export interface FetchExchangeRateAction {
  type: Actions.FETCH_EXCHANGE_RATE
  makerToken?: CURRENCY_ENUM
  makerAmount?: BigNumber
}

export interface SetExchangeRateAction {
  type: Actions.SET_EXCHANGE_RATE
  exchangeRatePair: ExchangeRatePair
}

export interface SetTobinTaxAction {
  type: Actions.SET_TOBIN_TAX
  tobinTax: string
}

export interface FetchTobinTaxAction {
  type: Actions.FETCH_TOBIN_TAX
  makerToken: CURRENCY_ENUM
  makerAmount: BigNumber
}

export interface ExchangeTokensAction {
  type: Actions.EXCHANGE_TOKENS
  makerToken: CURRENCY_ENUM
  makerAmount: BigNumber
}

export interface UpdateCeloGoldExchangeRateHistory {
  type: Actions.UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY
  timestamp: number
  exchangeRates: ExchangeRate[]
}

export interface WithdrawCeloAction {
  type: Actions.WITHDRAW_CELO
  amount: BigNumber
  recipientAddress: string
}

export interface WithdrawCeloFailureAction {
  type: Actions.WITHDRAW_CELO_FAILED
  idx: string | undefined
  error: ErrorMessages
}

export interface WithdrawCeloSuccessAction {
  type: Actions.WITHDRAW_CELO_SUCCESS
}

export const fetchExchangeRate = (
  makerToken?: CURRENCY_ENUM,
  makerAmount?: BigNumber
): FetchExchangeRateAction => ({
  type: Actions.FETCH_EXCHANGE_RATE,
  makerToken,
  makerAmount,
})

export const setExchangeRate = (exchangeRatePair: ExchangeRatePair): SetExchangeRateAction => ({
  type: Actions.SET_EXCHANGE_RATE,
  exchangeRatePair,
})

export const fetchTobinTax = (makerAmount: BigNumber, makerToken: CURRENCY_ENUM) => ({
  type: Actions.FETCH_TOBIN_TAX,
  makerAmount,
  makerToken,
})

export const setTobinTax = (tobinTax: string): SetTobinTaxAction => ({
  type: Actions.SET_TOBIN_TAX,
  tobinTax,
})

export const updateCeloGoldExchangeRateHistory = (
  exchangeRates: ExchangeRate[],
  timestamp: number
): UpdateCeloGoldExchangeRateHistory => ({
  type: Actions.UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY,
  exchangeRates,
  timestamp,
})

export const exchangeTokens = (
  makerToken: CURRENCY_ENUM,
  makerAmount: BigNumber
): ExchangeTokensAction => ({
  type: Actions.EXCHANGE_TOKENS,
  makerToken,
  makerAmount,
})

export const withdrawCelo = (amount: BigNumber, recipientAddress: string): WithdrawCeloAction => ({
  type: Actions.WITHDRAW_CELO,
  amount,
  recipientAddress,
})

export const withdrawCeloFailed = (
  idx: string | undefined,
  error: ErrorMessages
): WithdrawCeloFailureAction => ({
  type: Actions.WITHDRAW_CELO_FAILED,
  idx,
  error,
})

export const withdrawCeloSuccess = (): WithdrawCeloSuccessAction => ({
  type: Actions.WITHDRAW_CELO_SUCCESS,
})

export type ActionTypes =
  | SetExchangeRateAction
  | ExchangeTokensAction
  | SetTobinTaxAction
  | UpdateCeloGoldExchangeRateHistory
  | WithdrawCeloAction
  | WithdrawCeloFailureAction
  | WithdrawCeloSuccessAction
