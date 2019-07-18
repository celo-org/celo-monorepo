import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { Actions, ActionTypes, UpdateWeb3SyncProgressAction } from 'src/web3/actions'

export interface State {
  isReady: boolean
  syncProgress: number
  syncProgressData: {
    currentBlock: number
    startBlock: number
    highestBlock: number
  }
  latestBlockNumber: number
  account: string | null
  commentKey: string | null
  gasPrice?: number
  gasPriceLastUpdated: number
}

const initialState: State = {
  isReady: false,
  syncProgress: 0,
  syncProgressData: {
    currentBlock: 0,
    highestBlock: 0,
    startBlock: 0,
  },
  latestBlockNumber: 0,
  account: null,
  commentKey: null,
  gasPriceLastUpdated: 0,
}

function calculateSyncProgress(action: UpdateWeb3SyncProgressAction) {
  if (action.payload.currentBlock === 0) {
    return 0
  }
  const numerator = action.payload.currentBlock - action.payload.startingBlock
  const denominator = action.payload.highestBlock - action.payload.startingBlock
  return (100 * numerator) / denominator
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
        syncProgress: 0,
        syncProgressData: {
          currentBlock: 0,
          highestBlock: 0,
          startBlock: 0,
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
    case Actions.SET_PROGRESS:
      return {
        ...state,
        syncProgress: action.payload.syncProgress,
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
    case Actions.UPDATE_WEB3_SYNC_PROGRESS:
      return {
        ...state,
        syncProgress: calculateSyncProgress(action),
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
