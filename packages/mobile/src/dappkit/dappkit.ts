import {
  AccountAuthRequest,
  AccountAuthResponseSuccess,
  produceResponseDeeplink,
  SignTxRequest,
  SignTxResponseSuccess,
} from '@celo/utils/src/dappkit'
import { Linking } from 'react-native'
import { call, select, takeLeading } from 'redux-saga/effects'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'dappkit/dappkit'

export enum actions {
  APPROVE_ACCOUNT_AUTH = 'DAPPKIT/APPROVE_ACCOUNT_AUTH',
  REQUEST_TX_SIGNATURE = 'DAPPKIT/REQUEST_TX_SIGNATURE',
}

export interface ApproveAccountAuthAction {
  type: actions.APPROVE_ACCOUNT_AUTH
  request: AccountAuthRequest
}

export const approveAccountAuth = (request: AccountAuthRequest): ApproveAccountAuthAction => ({
  type: actions.APPROVE_ACCOUNT_AUTH,
  request,
})

export interface RequestTxSignatureAction {
  type: actions.REQUEST_TX_SIGNATURE
  request: SignTxRequest
}

export const requestTxSignature = (request: SignTxRequest): RequestTxSignatureAction => ({
  type: actions.REQUEST_TX_SIGNATURE,
  request,
})

function* respondToAccountAuth(action: ApproveAccountAuthAction) {
  Logger.debug(TAG, 'Approving auth account')
  const account = yield select(currentAccountSelector)
  Linking.openURL(produceResponseDeeplink(action.request, AccountAuthResponseSuccess(account)))
}

// TODO Error handling here
function* produceTxSignature(action: RequestTxSignatureAction) {
  Logger.debug(TAG, 'Producing tx signature')

  yield call(getConnectedUnlockedAccount)

  const signedTx = yield web3.eth.signTransaction({
    from: action.request.from,
    to: action.request.to,
    gasPrice: '0',
    gas: action.request.estimatedGas,
    data: action.request.txData,
    nonce: action.request.nonce,
    // @ts-ignore
    gasCurrency: action.request.gasCurrency,
  })

  Logger.debug(TAG, 'Tx signed, opening URL')
  Linking.openURL(produceResponseDeeplink(action.request, SignTxResponseSuccess(signedTx.raw)))
}

export function* dappKitSaga() {
  yield takeLeading(actions.APPROVE_ACCOUNT_AUTH, respondToAccountAuth)
  yield takeLeading(actions.REQUEST_TX_SIGNATURE, produceTxSignature)
}
