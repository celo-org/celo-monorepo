import {
  AccountAuthRequest,
  AccountAuthResponseSuccess,
  DappKitRequestTypes,
  parseDappKitRequestDeeplink,
  produceResponseDeeplink,
  SignTxRequest,
  SignTxResponseSuccess,
} from '@celo/utils/src/dappkit'
import { Linking } from 'react-native'
import { call, select, takeLeading } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
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
  const phoneNumber = yield select(e164NumberSelector)
  Linking.openURL(
    produceResponseDeeplink(action.request, AccountAuthResponseSuccess(account, phoneNumber))
  )
}

// TODO Error handling here
function* produceTxSignature(action: RequestTxSignatureAction) {
  Logger.debug(TAG, 'Producing tx signature')

  yield call(getConnectedUnlockedAccount)
  const rawTxs = yield Promise.all(
    action.request.txs.map(async (tx) => {
      const params: any = {
        from: tx.from,
        gasPrice: '0',
        gas: tx.estimatedGas,
        data: tx.txData,
        nonce: tx.nonce,
        value: tx.value,
        // @ts-ignore
        gasCurrency: action.request.gasCurrency,
      }
      if (tx.to) {
        params.to = tx.to
      }
      const signedTx = await web3.eth.signTransaction(params)
      return signedTx.raw
    })
  )

  Logger.debug(TAG, 'Txs signed, opening URL')
  Linking.openURL(produceResponseDeeplink(action.request, SignTxResponseSuccess(rawTxs)))
}

export function* dappKitSaga() {
  yield takeLeading(actions.APPROVE_ACCOUNT_AUTH, respondToAccountAuth)
  yield takeLeading(actions.REQUEST_TX_SIGNATURE, produceTxSignature)
}

export function handleDappkitDeepLink(deepLink: string) {
  try {
    const dappKitRequest = parseDappKitRequestDeeplink(deepLink)
    switch (dappKitRequest.type) {
      case DappKitRequestTypes.ACCOUNT_ADDRESS:
        navigate(Screens.DappKitAccountAuth, { dappKitRequest })
        break
      case DappKitRequestTypes.SIGN_TX:
        navigate(Screens.DappKitSignTxScreen, { dappKitRequest })
        break
      default:
        Logger.warn(TAG, 'Unsupported dapp request type')
    }
  } catch (error) {
    Logger.debug(TAG, `Deep link not valid for dappkit: ${error}`)
  }
}
