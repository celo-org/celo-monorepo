import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import { call, put, select, spawn, take, takeLeading } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { calculateFee } from 'src/fees/saga'
import { completePaymentRequest } from 'src/firebase/actions'
import { transferGoldToken } from 'src/goldToken/actions'
import { encryptComment } from 'src/identity/commentEncryption'
import { addressToE164NumberSelector, e164NumberToAddressSelector } from 'src/identity/reducer'
import { InviteBy } from 'src/invite/actions'
import { sendInvite } from 'src/invite/saga'
import { navigateHome } from 'src/navigator/NavigationService'
import { handleBarcode, shareSVGImage } from 'src/qrcode/utils'
import { recipientCacheSelector } from 'src/recipients/reducer'
import {
  Actions,
  SendPaymentOrInviteAction,
  sendPaymentOrInviteFailure,
  sendPaymentOrInviteSuccess,
} from 'src/send/actions'
import { transferStableToken } from 'src/stableToken/actions'
import {
  BasicTokenTransfer,
  createTokenTransferTransaction,
  getCurrencyAddress,
} from 'src/tokens/saga'
import { generateStandbyTransactionId } from 'src/transactions/actions'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'
import { estimateGas } from 'src/web3/utils'

const TAG = 'send/saga'

export async function getSendTxGas(
  account: string,
  currency: CURRENCY_ENUM,
  params: BasicTokenTransfer
) {
  try {
    Logger.debug(`${TAG}/getSendTxGas`, 'Getting gas estimate for send tx')
    const tx = await createTokenTransferTransaction(currency, params)
    const txParams = { from: account, feeCurrency: await getCurrencyAddress(currency) }
    const gas = await estimateGas(tx.txo, txParams)
    Logger.debug(`${TAG}/getSendTxGas`, `Estimated gas of ${gas.toString()}`)
    return gas
  } catch (error) {
    throw Error(ErrorMessages.INSUFFICIENT_BALANCE)
  }
}

export async function getSendFee(
  account: string,
  currency: CURRENCY_ENUM,
  params: BasicTokenTransfer
) {
  try {
    const gas = await getSendTxGas(account, currency, params)
    return calculateFee(gas)
  } catch (error) {
    throw error
  }
}

export function* watchQrCodeDetections() {
  while (true) {
    const action = yield take(Actions.BARCODE_DETECTED)
    Logger.debug(TAG, 'Barcode detected in watcher')
    const addressToE164Number = yield select(addressToE164NumberSelector)
    const recipientCache = yield select(recipientCacheSelector)
    const e164NumberToAddress = yield select(e164NumberToAddressSelector)
    let secureSendTxData

    if (action.scanIsForSecureSend) {
      secureSendTxData = action.transactionData
    }

    try {
      yield call(
        handleBarcode,
        action.data,
        addressToE164Number,
        recipientCache,
        e164NumberToAddress,
        secureSendTxData
      )
    } catch (error) {
      Logger.error(TAG, 'Error handling the barcode', error)
    }
  }
}

export function* watchQrCodeShare() {
  while (true) {
    const action = yield take(Actions.QRCODE_SHARE)
    try {
      yield call(shareSVGImage, action.qrCodeSvg)
    } catch (error) {
      Logger.error(TAG, 'Error handling the barcode', error)
    }
  }
}

function* sendPayment(
  recipientAddress: string,
  amount: BigNumber,
  comment: string,
  currency: CURRENCY_ENUM
) {
  try {
    ValoraAnalytics.track(SendEvents.send_tx_start)
    const txId = generateStandbyTransactionId(recipientAddress)

    switch (currency) {
      case CURRENCY_ENUM.GOLD: {
        yield put(
          transferGoldToken({
            recipientAddress,
            amount: amount.toString(),
            comment,
            txId,
          })
        )
        break
      }
      case CURRENCY_ENUM.DOLLAR: {
        yield put(
          transferStableToken({
            recipientAddress,
            amount: amount.toString(),
            comment,
            txId,
          })
        )
        break
      }
      default: {
        Logger.showError(`Sending currency ${currency} not yet supported`)
      }
    }
    ValoraAnalytics.track(SendEvents.send_tx_complete)
  } catch (error) {
    Logger.error(`${TAG}/sendPayment`, 'Could not send payment', error)
    ValoraAnalytics.track(SendEvents.send_tx_error, { error: error.message })
    throw error
  }
}

function* sendPaymentOrInviteSaga({
  amount,
  comment,
  recipient,
  recipientAddress,
  inviteMethod,
  firebasePendingRequestUid,
}: SendPaymentOrInviteAction) {
  try {
    if (!recipient?.e164PhoneNumber && !recipient?.address) {
      throw new Error("Can't send to recipient without valid e164PhoneNumber or address")
    }

    const ownAddress: string = yield select(currentAccountSelector)
    if (recipientAddress) {
      const encryptedComment = yield call(
        encryptComment,
        comment,
        recipientAddress,
        ownAddress,
        true
      )
      yield call(sendPayment, recipientAddress, amount, encryptedComment, CURRENCY_ENUM.DOLLAR)
    } else if (recipient.e164PhoneNumber) {
      yield call(
        sendInvite,
        recipient.e164PhoneNumber,
        inviteMethod || InviteBy.SMS,
        amount,
        CURRENCY_ENUM.DOLLAR
      )
    }

    if (firebasePendingRequestUid) {
      yield put(completePaymentRequest(firebasePendingRequestUid))
    }

    navigateHome()
    yield put(sendPaymentOrInviteSuccess(amount))
  } catch (e) {
    yield put(showError(ErrorMessages.SEND_PAYMENT_FAILED))
    yield put(sendPaymentOrInviteFailure())
  }
}

export function* watchSendPaymentOrInvite() {
  yield takeLeading(Actions.SEND_PAYMENT_OR_INVITE, sendPaymentOrInviteSaga)
}

export function* sendSaga() {
  yield spawn(watchQrCodeDetections)
  yield spawn(watchQrCodeShare)
  yield spawn(watchSendPaymentOrInvite)
}
