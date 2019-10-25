import { LocalCurrencyCode } from 'src/localCurrency/consts'

export enum Actions {
  FETCH_CURRENT_RATE = 'LOCAL_CURRENCY/FETCH_CURRENT_RATE',
  FETCH_CURRENT_RATE_SUCCESS = 'LOCAL_CURRENCY/FETCH_CURRENT_RATE_SUCCESS',
  FETCH_CURRENT_RATE_FAILURE = 'LOCAL_CURRENCY/FETCH_CURRENT_RATE_FAILURE',
  SELECT_PREFERRED_CURRENCY = 'LOCAL_CURRENCY/SELECT_PREFERRED_CURRENCY',
}
export interface FetchCurrentRateAction {
  type: Actions.FETCH_CURRENT_RATE
}

export interface FetchCurrentRateSuccessAction {
  type: Actions.FETCH_CURRENT_RATE_SUCCESS
  currencyCode: LocalCurrencyCode
  exchangeRate: number
  now: number
}

export interface FetchCurrentRateFailureAction {
  type: Actions.FETCH_CURRENT_RATE_FAILURE
}

export interface SelectPreferredCurrencyAction {
  type: Actions.SELECT_PREFERRED_CURRENCY
  currencyCode: LocalCurrencyCode
}

export type ActionTypes =
  | FetchCurrentRateAction
  | FetchCurrentRateSuccessAction
  | FetchCurrentRateFailureAction
  | SelectPreferredCurrencyAction

export const fetchCurrentRate = (): FetchCurrentRateAction => ({
  type: Actions.FETCH_CURRENT_RATE,
})

export const fetchCurrentRateSuccess = (
  currencyCode: LocalCurrencyCode,
  exchangeRate: number,
  now: number
): FetchCurrentRateSuccessAction => ({
  type: Actions.FETCH_CURRENT_RATE_SUCCESS,
  currencyCode,
  exchangeRate,
  now,
})

export const fetchCurrentRateFailure = (): FetchCurrentRateFailureAction => ({
  type: Actions.FETCH_CURRENT_RATE_FAILURE,
})

export const selectPreferredCurrency = (
  currencyCode: LocalCurrencyCode
): SelectPreferredCurrencyAction => ({
  type: Actions.SELECT_PREFERRED_CURRENCY,
  currencyCode,
})
