import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import { InitializationState } from 'src/geth/reducer'

export enum Actions {
  SET_INIT_STATE = 'GETH/SET_INIT_STATE',
  SET_GETH_CONNECTED = 'GETH/SET_GETH_CONNECTED',
  CANCEL_GETH_SAGA = 'GETH/CANCEL_GETH_SAGA',
  SET_ACCOUNT = 'GETH/SET_ACCOUNT',
  SET_ACCOUNT_IN_GETH_KEYSTORE = 'GETH/SET_ACCOUNT_IN_GETH_KEYSTORE',
  SET_COMMENT_KEY = 'WEB3/SET_COMMENT_KEY',
}

export interface SetAccountAction {
  type: Actions.SET_ACCOUNT
  address: string
}

export interface SetAccountInGethKeystoreAction {
  type: Actions.SET_ACCOUNT_IN_GETH_KEYSTORE
  address: string
}

export interface SetCommentKeyAction {
  type: Actions.SET_COMMENT_KEY
  commentKey: string
}

interface SetInitStateAction {
  type: Actions.SET_INIT_STATE
  state: InitializationState
}

export const setAccount = (address: string): SetAccountAction => {
  CeloAnalytics.track(DefaultEventNames.accountSet)
  return {
    type: Actions.SET_ACCOUNT,
    address: address.toLowerCase(),
  }
}

export const setAccountInGethKeystore = (address: string): SetAccountInGethKeystoreAction => {
  return {
    type: Actions.SET_ACCOUNT_IN_GETH_KEYSTORE,
    address,
  }
}

export const setPrivateCommentKey = (commentKey: string): SetCommentKeyAction => {
  return {
    type: Actions.SET_COMMENT_KEY,
    commentKey,
  }
}

export const setInitState = (state: InitializationState): SetInitStateAction => ({
  type: Actions.SET_INIT_STATE,
  state,
})

export const cancelGethSaga = () => ({
  type: Actions.CANCEL_GETH_SAGA,
})

interface SetGethConnectedAction {
  type: Actions.SET_GETH_CONNECTED
  connected: boolean
}

export const setGethConnected = (connected: boolean): SetGethConnectedAction => ({
  type: Actions.SET_GETH_CONNECTED,
  connected,
})

export type ActionTypes =
  | SetInitStateAction
  | SetGethConnectedAction
  | SetAccountAction
  | SetAccountInGethKeystoreAction
  | SetCommentKeyAction
