export enum Actions {
  SET_PROGRESS = 'WEB3/SET_PROGRESS',
  SET_IS_READY = 'WEB3/SET_IS_READY',
  SET_IS_FORNO = 'WEB3/SET_IS_FORNO',
  TOGGLE_IS_FORNO = 'WEB3/TOGGLE_IS_FORNO',
  COMPLETE_WEB3_SYNC = 'WEB3/COMPLETE_WEB3_SYNC',
  REQUEST_SYNC_PROGRESS = 'WEB3/REQUEST_SYNC_PROGRESS',
  UPDATE_WEB3_SYNC_PROGRESS = 'WEB3/UPDATE_WEB3_SYNC_PROGRESS',
  SET_CONTRACT_KIT_READY = 'WEB3/SET_CONTRACT_KIT_READY',
}

export interface SetIsFornoAction {
  type: Actions.SET_IS_FORNO
  fornoMode: boolean
}

export interface ToggleIsFornoAction {
  type: Actions.TOGGLE_IS_FORNO
  fornoMode: boolean
}

export interface CompleteWeb3SyncAction {
  type: Actions.COMPLETE_WEB3_SYNC
  latestBlockNumber: number
}

export interface UpdateWeb3SyncProgressAction {
  type: Actions.UPDATE_WEB3_SYNC_PROGRESS
  payload: {
    startingBlock: number
    currentBlock: number
    highestBlock: number
  }
}

export interface SetContractKitReadyAction {
  type: Actions.SET_CONTRACT_KIT_READY
  ready: boolean
}

export type ActionTypes =
  | SetIsFornoAction
  | ToggleIsFornoAction
  | CompleteWeb3SyncAction
  | UpdateWeb3SyncProgressAction
  | SetContractKitReadyAction

export const toggleFornoMode = (fornoMode: boolean): ToggleIsFornoAction => {
  return {
    type: Actions.TOGGLE_IS_FORNO,
    fornoMode,
  }
}

export const setFornoMode = (fornoMode: boolean): SetIsFornoAction => {
  return {
    type: Actions.SET_IS_FORNO,
    fornoMode,
  }
}

export const setContractKitReady = (ready: boolean): SetContractKitReadyAction => {
  return {
    type: Actions.SET_CONTRACT_KIT_READY,
    ready,
  }
}

export const completeWeb3Sync = (latestBlockNumber: number): CompleteWeb3SyncAction => ({
  type: Actions.COMPLETE_WEB3_SYNC,
  latestBlockNumber,
})

export interface Web3SyncProgress {
  startingBlock: number
  currentBlock: number
  highestBlock: number
}

export const updateWeb3SyncProgress = (
  payload: Web3SyncProgress
): UpdateWeb3SyncProgressAction => ({
  type: Actions.UPDATE_WEB3_SYNC_PROGRESS,
  payload,
})
