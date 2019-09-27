import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'

const TAG = 'web3/actions'

export enum Actions {
  SET_ACCOUNT = 'WEB3/SET_ACCOUNT',
  SET_COMMENT_KEY = 'WEB3/SET_COMMENT_KEY',
  SET_PROGRESS = 'WEB3/SET_PROGRESS',
  SET_IS_READY = 'WEB3/SET_IS_READY',
  SET_BLOCK_NUMBER = 'WEB3/SET_BLOCK_NUMBER',
  REQUEST_SYNC_PROGRESS = 'WEB3/REQUEST_SYNC_PROGRESS',
  UPDATE_WEB3_SYNC_PROGRESS = 'WEB3/UPDATE_WEB3_SYNC_PROGRESS',
}

export interface SetAccountAction {
  type: Actions.SET_ACCOUNT
  address: string
}

export interface SetCommentKeyAction {
  type: Actions.SET_COMMENT_KEY
  commentKey: string
}

export interface SetLatestBlockNumberAction {
  type: Actions.SET_BLOCK_NUMBER
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
  | SetCommentKeyAction
  | SetLatestBlockNumberAction
  | UpdateWeb3SyncProgressAction

export const setAccount = (address: string): SetAccountAction => {
  CeloAnalytics.track(DefaultEventNames.accountSet, { address })
  return {
    type: Actions.SET_ACCOUNT,
    address,
  }
}

export const setPrivateCommentKey = (commentKey: string): SetCommentKeyAction => {
  return {
    type: Actions.SET_COMMENT_KEY,
    commentKey,
  }
}

export const setLatestBlockNumber = (latestBlockNumber: number): SetLatestBlockNumberAction => ({
  type: Actions.SET_BLOCK_NUMBER,
  latestBlockNumber,
})

export const updateWeb3SyncProgress = (payload: {
  startingBlock: number
  currentBlock: number
  highestBlock: number
}): UpdateWeb3SyncProgressAction => ({
  type: Actions.UPDATE_WEB3_SYNC_PROGRESS,
  payload,
})

export const checkSyncProgress = () => ({ type: Actions.REQUEST_SYNC_PROGRESS })

export function getLatestBlock() {
  Logger.debug(TAG, 'Getting latest block')
  return web3.eth.getBlock('latest')
}

export function getBlock(blockNumber: number) {
  Logger.debug(TAG, 'Getting block ' + blockNumber)
  return web3.eth.getBlock(blockNumber)
}
