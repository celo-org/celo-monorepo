export enum Actions {
  FETCH_CURRENT_RATE_START = 'LOCAL_CURRENCY/FETCH_CURRENT_RATE_START',
  FETCH_CURRENT_RATE_SUCCESS = 'LOCAL_CURRENCY/FETCH_CURRENT_RATE_SUCCESS',
  FETCH_CURRENT_RATE_FAILURE = 'LOCAL_CURRENCY/FETCH_CURRENT_RATE_FAILURE',
}
export interface FetchCurrentRateAction {
  type: Actions.FETCH_CURRENT_RATE_START
}

export interface FetchCurrentRateSuccessAction {
  type: Actions.FETCH_CURRENT_RATE_SUCCESS
  exchangeRate: number
  now: number
}

export interface FetchCurrentRateFailureAction {
  type: Actions.FETCH_CURRENT_RATE_FAILURE
}

export type ActionTypes =
  | FetchCurrentRateAction
  | FetchCurrentRateSuccessAction
  | FetchCurrentRateFailureAction

export const fetchCurrentRateStart = (): FetchCurrentRateAction => ({
  type: Actions.FETCH_CURRENT_RATE_START,
})

export const fetchCurrentRateSuccess = (
  exchangeRate: number,
  now: number
): FetchCurrentRateSuccessAction => ({
  type: Actions.FETCH_CURRENT_RATE_SUCCESS,
  exchangeRate,
  now,
})

export const fetchCurrentRateFailure = (): FetchCurrentRateFailureAction => ({
  type: Actions.FETCH_CURRENT_RATE_FAILURE,
})
