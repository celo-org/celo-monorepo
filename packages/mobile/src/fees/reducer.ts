import { combineReducers } from 'redux'
import { Actions, ActionTypes, FeeType } from 'src/fees/actions'

interface FeeEstimateState {
  feeInWei: string | null
  lastUpdated: number | null
}

const feeEstimateInitialState = {
  feeInWei: null,
  lastUpdated: null,
}

function createEstimateReducer(feeType: FeeType) {
  return function estimateReducer(
    state: FeeEstimateState = feeEstimateInitialState,
    action: ActionTypes
  ): FeeEstimateState {
    if (action.feeType !== feeType) {
      return state
    }

    switch (action.type) {
      case Actions.DEFAULT_FEE_UPDATED:
        return {
          ...state,
          feeInWei: action.feeInWei,
        }
      default:
        return state
    }
  }
}

export interface State {
  invite: FeeEstimateState
  send: FeeEstimateState
  exchange: FeeEstimateState
  reclaimEscrow: FeeEstimateState
}

export const reducer = combineReducers({
  invite: createEstimateReducer(FeeType.INVITE),
  send: createEstimateReducer(FeeType.SEND),
  exchange: createEstimateReducer(FeeType.EXCHANGE),
  reclaimEscrow: createEstimateReducer(FeeType.RECLAIM_ESCROW),
})
