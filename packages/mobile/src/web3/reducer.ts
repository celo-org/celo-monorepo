import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { Actions, ActionTypes } from 'src/web3/actions'

export interface State {
  isReady: boolean
  latestBlockNumber: number
  account: string | null
  commentKey: string | null
  gasPrice?: number
  gasPriceLastUpdated: number
}

const initialState: State = {
  isReady: false,
  latestBlockNumber: 0,
  account: null,
  commentKey: null,
  gasPriceLastUpdated: 0,
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'web3'),
        isReady: false,
        latestBlockNumber: 0,
      }
    }
    case Actions.SET_ACCOUNT:
      return {
        ...state,
        account: action.address,
      }
    case Actions.SET_COMMENT_KEY:
      return {
        ...state,
        commentKey: action.commentKey,
      }
    case Actions.SET_IS_READY:
      return {
        ...state,
        isReady: action.payload.isReady,
      }
    case Actions.SET_BLOCK_NUMBER:
      return {
        ...state,
        latestBlockNumber: action.latestBlockNumber,
      }
    case Actions.SET_GAS_PRICE:
      return {
        ...state,
        gasPrice: action.gasPrice,
        gasPriceLastUpdated: action.gasPriceLastUpdated,
      }

    default:
      return state
  }
}
