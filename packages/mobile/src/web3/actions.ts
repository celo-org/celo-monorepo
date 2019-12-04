import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'

const TAG = 'web3/actions'

export enum Actions {
  SET_ACCOUNT = 'WEB3/SET_ACCOUNT',
  SET_ACCOUNT_IN_WEB3_KEYSTORE = 'WEB3/SET_ACCOUNT_IN_WEB3_KEYSTORE',
  SET_COMMENT_KEY = 'WEB3/SET_COMMENT_KEY',
  SET_PROGRESS = 'WEB3/SET_PROGRESS',
  SET_IS_READY = 'WEB3/SET_IS_READY',
  SET_IS_ZERO_SYNC = 'WEB3/SET_IS_ZERO_SYNC',
  TOGGLE_IS_ZERO_SYNC = 'WEB3/TOGGLE_IS_ZERO_SYNC',
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

export interface SetIsZeroSyncAction {
  type: Actions.SET_IS_ZERO_SYNC
  zeroSyncMode: boolean
}

export interface ToggleIsZeroSyncAction {
  type: Actions.TOGGLE_IS_ZERO_SYNC
  zeroSyncMode: boolean
}

export interface SetCommentKeyAction {
  type: Actions.SET_COMMENT_KEY
  commentKey: string
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
  | SetIsZeroSyncAction
  | ToggleIsZeroSyncAction
  | SetCommentKeyAction
  | CompleteWeb3SyncAction
  | UpdateWeb3SyncProgressAction

export const setAccount = (address: string): SetAccountAction => {
  CeloAnalytics.track(DefaultEventNames.accountSet)
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

export const toggleZeroSyncMode = (zeroSyncMode: boolean): ToggleIsZeroSyncAction => {
  return {
    type: Actions.TOGGLE_IS_ZERO_SYNC,
    zeroSyncMode,
  }
}

export const setZeroSyncMode = (zeroSyncMode: boolean): SetIsZeroSyncAction => {
  return {
    type: Actions.SET_IS_ZERO_SYNC,
    zeroSyncMode,
  }
}

export const setPrivateCommentKey = (commentKey: string): SetCommentKeyAction => {
  return {
    type: Actions.SET_COMMENT_KEY,
    commentKey,
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

export const checkSyncProgress = () => ({ type: Actions.REQUEST_SYNC_PROGRESS })

// Note: This returns Promise<Block>
export function getLatestBlock() {
  Logger.debug(TAG, 'Getting latest block')
  return web3.eth.getBlock('latest')
}

// Note: This returns Promise<Block>
export function getBlock(blockNumber: number) {
  Logger.debug(TAG, 'Getting block ' + blockNumber)
  return web3.eth.getBlock(blockNumber)
}
