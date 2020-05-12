import {
  AccountAuthRequest,
  AccountAuthResponseSuccess,
  DappKitRequestTypes,
  parseDappKitRequestDeeplink,
  produceResponseDeeplink,
  SignTxRequest,
  SignTxResponseSuccess,
} from '@celo/utils/src/dappkit'
import { call, select, takeLeading } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
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
  navigateToURI(
    produceResponseDeeplink(action.request, AccountAuthResponseSuccess(account, phoneNumber))
  )
}

// TODO Error handling here
function* produceTxSignature(action: RequestTxSignatureAction) {
  Logger.debug(TAG, 'Producing tx signature')

  yield call(getConnectedUnlockedAccount)
  const contractKit = yield call(getContractKit)

  const rawTxs = yield Promise.all(
    action.request.txs.map(async (tx) => {
      // TODO offload this logic to walletkit or contractkit, otherwise they
      // could diverge again and create another bug
      // See https://github.com/celo-org/celo-monorepo/issues/3045

      // In walletKit we use web3.eth.getCoinbase() to get gateway fee recipient
      // but that's throwing errors here. Not sure why, but txs work without it.
      const gatewayFeeRecipient = undefined
      const gatewayFee = undefined
      const gas = Math.round(tx.estimatedGas * 1.5)

      const params: any = {
        from: tx.from,
        gasPrice: '0',
        gas,
        data: tx.txData,
        nonce: tx.nonce,
        value: tx.value,
        feeCurrency: tx.feeCurrencyAddress,
        gatewayFeeRecipient,
        gatewayFee,
      }
      if (tx.to) {
        params.to = tx.to
      }
      Logger.debug(TAG, 'Signing tx with params', JSON.stringify(params))
      const signedTx = await contractKit.web3.eth.signTransaction(params)
      return signedTx.raw
    })
  )

  Logger.debug(TAG, 'Txs signed, opening URL')
  navigateToURI(produceResponseDeeplink(action.request, SignTxResponseSuccess(rawTxs)))
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
