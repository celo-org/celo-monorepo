import {
  produceResponseDeeplink,
  SignTxRequest,
  SignTxResponseSuccess,
} from '@celo/utils/src/dappkit'
import { Linking } from 'react-native'
import { call, takeLeading } from 'redux-saga/effects'
import { web3 } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'

export enum actions {
  REQUEST_TX_SIGNATURE = 'DAPPKIT/REQUEST_TX_SIGNATURE',
}
export interface RequestTxSignatureAction {
  type: actions.REQUEST_TX_SIGNATURE
  request: SignTxRequest
}

export const requestTxSignature = (request: SignTxRequest): RequestTxSignatureAction => ({
  type: actions.REQUEST_TX_SIGNATURE,
  request,
})

export type Actions = RequestTxSignatureAction

function* produceTxSignatureSaga(action: RequestTxSignatureAction) {
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

  Linking.openURL(produceResponseDeeplink(action.request, SignTxResponseSuccess(signedTx.raw)))
}

export function* dappKitSaga() {
  yield takeLeading(actions.REQUEST_TX_SIGNATURE, produceTxSignatureSaga)
}
