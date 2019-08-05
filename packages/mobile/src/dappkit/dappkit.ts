import { Linking } from 'react-native'
import { call, takeLeading } from 'redux-saga/effects'
import { web3 } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
export enum actions {
  REQUEST_TX_SIGNATURE = 'DAPPKIT/REQUEST_TX_SIGNATURE',
}
export type RequestTxSignatureAction = {
  type: actions.REQUEST_TX_SIGNATURE
  txData: string
  estimatedGas: number
  from: string
  to: string
  nonce: number
  callback: string
}

export const requestTxSignature = (
  txData: string,
  estimatedGas: number,
  from: string,
  to: string,
  nonce: number,
  callback: string
): RequestTxSignatureAction => ({
  type: actions.REQUEST_TX_SIGNATURE,
  txData,
  estimatedGas,
  from,
  to,
  nonce,
  callback,
})

export type Actions = RequestTxSignatureAction

function* produceTxSignatureSaga(action: RequestTxSignatureAction) {
  yield call(getConnectedUnlockedAccount)

  const signedTx = yield web3.eth.signTransaction({
    from: action.from,
    to: action.to,
    gasPrice: '0',
    gas: action.estimatedGas,
    data: action.txData,
    nonce: action.nonce,
  })

  Linking.openURL(action.callback + '?op=sign_tx&rawTx=' + signedTx.raw)
}

export function* saga() {
  yield takeLeading(actions.REQUEST_TX_SIGNATURE, produceTxSignatureSaga)
}
