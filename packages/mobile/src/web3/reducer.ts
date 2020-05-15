import networkConfig from 'src/geth/networkConfig'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { Actions, ActionTypes, Web3SyncProgress } from 'src/web3/actions'

export interface State {
  syncProgress: Web3SyncProgress
  latestBlockNumber: number
  fornoMode: boolean
  contractKitReady: boolean
}

const initialState: State = {
  syncProgress: {
    startingBlock: 0,
    currentBlock: 0,
    highestBlock: 0,
  },
  latestBlockNumber: 0,
  fornoMode: networkConfig.initiallyForno,
  contractKitReady: false,
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
        contractKitReady: false,
        // False to lock ContractKit upon every app reopen, until
        // store is persisted and forno mode known
      }
    }
    case Actions.SET_IS_FORNO:
      return {
        ...state,
        fornoMode: action.fornoMode,
      }
    case Actions.COMPLETE_WEB3_SYNC:
      return {
        ...state,
        syncProgress: {
          startingBlock: state.syncProgress.startingBlock,
          currentBlock: action.latestBlockNumber,
          highestBlock: action.latestBlockNumber,
        },
        latestBlockNumber: action.latestBlockNumber,
      }
    case Actions.UPDATE_WEB3_SYNC_PROGRESS:
      return {
        ...state,
        syncProgress: action.payload,
      }
    case Actions.SET_CONTRACT_KIT_READY:
      return {
        ...state,
        contractKitReady: action.ready,
      }
    default:
      return state
  }
}
