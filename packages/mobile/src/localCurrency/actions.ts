export enum Actions {
  FETCH_CURRENT_RATE = 'LOCAL_CURRENCY/FETCH_CURRENT_RATE',
  FETCH_CURRENT_RATE_SUCCESS = 'LOCAL_CURRENCY/FETCH_CURRENT_RATE_SUCCESS',
  FETCH_CURRENT_RATE_FAILURE = 'LOCAL_CURRENCY/FETCH_CURRENT_RATE_FAILURE',
}
export interface FetchCurrentRateAction {
  type: Actions.FETCH_CURRENT_RATE
}

export interface FetchCurrentRateSuccessAction {
  type: Actions.FETCH_CURRENT_RATE_SUCCESS
  exchangeRate: number
}

export interface FetchCurrentRateFailureAction {
  type: Actions.FETCH_CURRENT_RATE_FAILURE
}

export type ActionTypes =
  | FetchCurrentRateAction
  | FetchCurrentRateSuccessAction
  | FetchCurrentRateFailureAction

export const fetchCurrentRate = (): FetchCurrentRateAction => ({
  type: Actions.FETCH_CURRENT_RATE,
})

export const fetchCurrentRateSuccess = (exchangeRate: number): FetchCurrentRateSuccessAction => ({
  type: Actions.FETCH_CURRENT_RATE_SUCCESS,
  exchangeRate,
})

export const fetchCurrentRateFailure = (): FetchCurrentRateFailureAction => ({
  type: Actions.FETCH_CURRENT_RATE_FAILURE,
})
