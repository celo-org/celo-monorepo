import networkConfig from 'src/geth/networkConfig'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { Actions, ActionTypes, Web3SyncProgress } from 'src/web3/actions'

export interface State {
  syncProgress: Web3SyncProgress
  latestBlockNumber: number
  account: string | null
  accountInWeb3Keystore: string | null
  // AKA data encryption key (DEK)
  // TODO rename in the next store migration
  commentKey: string | null
  // Has the data encryption key been registered in the Accounts contract
  isDekRegistered: boolean | undefined
  fornoMode: boolean
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
  isDekRegistered: false,
  fornoMode: networkConfig.initiallyForno,
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
    case Actions.SET_IS_FORNO:
      return {
        ...state,
        fornoMode: action.fornoMode,
      }
    case Actions.SET_DATA_ENCRYPTION_KEY:
      return {
        ...state,
        commentKey: action.key,
      }
    case Actions.REGISTER_DATA_ENCRYPTION_KEY:
      return {
        ...state,
        isDekRegistered: true,
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
    default:
      return state
  }
}
