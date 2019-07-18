import { getPincode } from 'src/account/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import { UNLOCK_DURATION } from 'src/geth/consts'
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
  SET_GAS_PRICE = 'WEB3/SET_GAS_PRICE',
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

export interface SetProgressAction {
  type: Actions.SET_PROGRESS
  payload: {
    syncProgress: number
  }
}

export interface UpdateWeb3SyncProgressAction {
  type: Actions.UPDATE_WEB3_SYNC_PROGRESS
  payload: {
    startingBlock: number
    currentBlock: number
    highestBlock: number
  }
}

export interface SetIsReadyAction {
  type: Actions.SET_IS_READY
  payload: {
    isReady: boolean
  }
}

export interface SetGasPriceAction {
  type: Actions.SET_GAS_PRICE
  gasPrice: number
  gasPriceLastUpdated: number
}

export type ActionTypes =
  | SetAccountAction
  | SetCommentKeyAction
  | SetProgressAction
  | SetIsReadyAction
  | SetLatestBlockNumberAction
  | UpdateWeb3SyncProgressAction
  | SetGasPriceAction

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

export const setSyncProgress = (syncProgress: number) => ({
  type: Actions.SET_PROGRESS,
  payload: {
    syncProgress,
  },
})

export const setGasPrice = (gasPrice: number): SetGasPriceAction => ({
  type: Actions.SET_GAS_PRICE,
  gasPrice,
  gasPriceLastUpdated: Date.now(),
})

// TODO: Remove duplicaiton with SetProgress action (this is currently unused)
export const updateWeb3SyncProgress = (payload: {
  startingBlock: number
  currentBlock: number
  highestBlock: number
}): UpdateWeb3SyncProgressAction => ({
  type: Actions.UPDATE_WEB3_SYNC_PROGRESS,
  payload,
})

export const setIsReady = (isReady: boolean) => ({
  type: Actions.SET_IS_READY,
  payload: {
    isReady,
  },
})

async function isLocked(address: any) {
  try {
    // Test account to see if it is unlocked
    await web3.eth.sign('', address)
  } catch (e) {
    return true
  }
  return false
}

export const unlockAccount = async (account: string) => {
  const isAccountLocked = await isLocked(account)
  let success = false
  if (isAccountLocked) {
    const password = await getPincode()
    // @ts-ignore
    success = await web3.eth.personal
      .unlockAccount(account, password, UNLOCK_DURATION)
      // @ts-ignore
      .catch((error: Error) => {
        Logger.error(TAG + '@unlockAccount', 'Web3 account unlock failed with' + error)
        return false
      })
  } else {
    success = true
  }
  return success
}

export const checkSyncProgress = () => ({ type: Actions.REQUEST_SYNC_PROGRESS })

export function getLatestBlock() {
  Logger.debug(TAG, 'Getting latest block')
  return web3.eth.getBlock('latest')
}

export function getBlock(blockNumber: number) {
  Logger.debug(TAG, 'Getting block ' + blockNumber)
  return web3.eth.getBlock(blockNumber)
}
