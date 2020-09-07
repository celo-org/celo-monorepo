export enum Actions {
  SET_ACCOUNT = 'WEB3/SET_ACCOUNT',
  SET_ACCOUNT_IN_WEB3_KEYSTORE = 'WEB3/SET_ACCOUNT_IN_WEB3_KEYSTORE',
  SET_DATA_ENCRYPTION_KEY = 'WEB3/SET_DATA_ENCRYPTION_KEY',
  REGISTER_DATA_ENCRYPTION_KEY = 'WEB3/REGISTER_DATA_ENCRYPTION_KEY',
  SET_PROGRESS = 'WEB3/SET_PROGRESS',
  SET_IS_READY = 'WEB3/SET_IS_READY',
  SET_IS_FORNO = 'WEB3/SET_IS_FORNO',
  TOGGLE_IS_FORNO = 'WEB3/TOGGLE_IS_FORNO',
  COMPLETE_WEB3_SYNC = 'WEB3/COMPLETE_WEB3_SYNC',
  REQUEST_SYNC_PROGRESS = 'WEB3/REQUEST_SYNC_PROGRESS',
  UPDATE_WEB3_SYNC_PROGRESS = 'WEB3/UPDATE_WEB3_SYNC_PROGRESS',
}

export interface SetAccountAction {
  type: Actions.SET_ACCOUNT
  address: string
}

export interface SetAccountInWeb3KeystoreAction {
  type: Actions.SET_ACCOUNT_IN_WEB3_KEYSTORE
  address: string
}

export interface SetIsFornoAction {
  type: Actions.SET_IS_FORNO
  fornoMode: boolean
}

export interface ToggleIsFornoAction {
  type: Actions.TOGGLE_IS_FORNO
  fornoMode: boolean
}

export interface SetDataEncryptionKeyAction {
  type: Actions.SET_DATA_ENCRYPTION_KEY
  key: string
}

export interface RegisterDataEncryptionKeyAction {
  type: Actions.REGISTER_DATA_ENCRYPTION_KEY
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

export type ActionTypes =
  | SetAccountAction
  | SetAccountInWeb3KeystoreAction
  | SetIsFornoAction
  | ToggleIsFornoAction
  | SetDataEncryptionKeyAction
  | RegisterDataEncryptionKeyAction
  | CompleteWeb3SyncAction
  | UpdateWeb3SyncProgressAction

export const setAccount = (address: string): SetAccountAction => {
  return {
    type: Actions.SET_ACCOUNT,
    address: address.toLowerCase(),
  }
}

export const setAccountInWeb3Keystore = (address: string): SetAccountInWeb3KeystoreAction => {
  return {
    type: Actions.SET_ACCOUNT_IN_WEB3_KEYSTORE,
    address,
  }
}

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

export const setDataEncryptionKey = (key: string): SetDataEncryptionKeyAction => {
  return {
    type: Actions.SET_DATA_ENCRYPTION_KEY,
    key,
  }
}

export const registerDataEncryptionKey = (): RegisterDataEncryptionKeyAction => {
  return {
    type: Actions.REGISTER_DATA_ENCRYPTION_KEY,
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
