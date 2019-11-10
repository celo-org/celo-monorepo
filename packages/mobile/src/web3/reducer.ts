import networkConfig from 'src/geth/networkConfig'
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
  accountInWeb3Keystore: string | null
  commentKey: string | null
  zeroSyncMode: boolean
}

const initialState: State = {
  syncProgress: {
    startingBlock: 0,
    currentBlock: 0,
    highestBlock: 0,
  },
  latestBlockNumber: 0,
  account: null,
  accountInWeb3Keystore: null,
  commentKey: null,
  zeroSyncMode: networkConfig.initiallyZeroSync,
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
        account: action.address.toLowerCase(),
      }
    case Actions.SET_ACCOUNT_IN_WEB3_KEYSTORE:
      return {
        ...state,
        accountInWeb3Keystore: action.address,
      }
    case Actions.SET_IS_ZERO_SYNC:
      return {
        ...state,
        zeroSyncMode: action.zeroSyncMode,
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
