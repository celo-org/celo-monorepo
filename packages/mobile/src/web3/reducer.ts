import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { Actions, ActionTypes } from 'src/web3/actions'

export interface State {
  syncProgress: {
    startingBlock: number
    currentBlock: number
    highestBlock: number
  }
  latestBlockNumber: number
  account: string | null
  commentKey: string | null
}

const initialState: State = {
  syncProgress: {
    startingBlock: 0,
    currentBlock: 0,
    highestBlock: 0,
  },
  latestBlockNumber: 0,
  account: null,
  commentKey: null,
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
        syncProgress: {
          startingBlock: 0,
          currentBlock: 0,
          highestBlock: 0,
        },
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
    case Actions.SET_BLOCK_NUMBER:
      return {
        ...state,
        latestBlockNumber: action.latestBlockNumber,
      }
    case Actions.UPDATE_WEB3_SYNC_PROGRESS:
      return {
        ...state,
        syncProgress: action.payload,
      }

    default:
      return state
  }
}
