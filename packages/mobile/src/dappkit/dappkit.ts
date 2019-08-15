import {
  produceResponseDeeplink,
  SignTxRequest,
  SignTxResponseSuccess,
} from '@celo/utils/src/dappkit'
import { Linking } from 'react-native'
import { call, takeLeading } from 'redux-saga/effects'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'dappkit/dappkit'

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
  Logger.debug(TAG, 'Producing tx signature')

  yield call(getConnectedUnlockedAccount)
  const rawTxs = yield Promise.all(
    action.request.txs.map(async (tx) => {
      const signedTx = await web3.eth.signTransaction({
        from: tx.from,
        to: tx.to,
        gasPrice: '0',
        gas: tx.estimatedGas,
        data: tx.txData,
        nonce: tx.nonce,
        // @ts-ignore
        gasCurrency: action.request.gasCurrency,
      })
      return signedTx.raw
    })
  )

  Logger.debug(TAG, 'Txs signed, opening URL')
  Linking.openURL(produceResponseDeeplink(action.request, SignTxResponseSuccess(rawTxs)))
}

export function* dappKitSaga() {
  yield takeLeading(actions.REQUEST_TX_SIGNATURE, produceTxSignatureSaga)
}
