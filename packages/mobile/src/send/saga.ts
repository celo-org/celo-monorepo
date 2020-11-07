import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import { call, put, select, spawn, take, takeLeading } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { calculateFee } from 'src/fees/saga'
import { transferGoldToken } from 'src/goldToken/actions'
import { encryptComment } from 'src/identity/commentEncryption'
import { addressToE164NumberSelector, e164NumberToAddressSelector } from 'src/identity/reducer'
import { InviteBy } from 'src/invite/actions'
import { sendInvite } from 'src/invite/saga'
import { navigateHome } from 'src/navigator/NavigationService'
import { completePaymentRequest } from 'src/paymentRequest/actions'
import { handleBarcode, shareSVGImage } from 'src/qrcode/utils'
import { recipientCacheSelector } from 'src/recipients/reducer'
import {
  Actions,
  HandleBarcodeDetectedAction,
  SendPaymentOrInviteAction,
  sendPaymentOrInviteFailure,
  sendPaymentOrInviteSuccess,
  ShareQRCodeAction,
} from 'src/send/actions'
import { transferStableToken } from 'src/stableToken/actions'
import {
  BasicTokenTransfer,
  createTokenTransferTransaction,
  getCurrencyAddress,
} from 'src/tokens/saga'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getRegisterDekTxGas, registerAccountDek } from 'src/web3/dataEncryptionKey'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
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
    const txParams = {
      from: account,
      feeCurrency: currency === CURRENCY_ENUM.GOLD ? undefined : await getCurrencyAddress(currency),
    }
    const gas = await estimateGas(tx.txo, txParams)
    Logger.debug(`${TAG}/getSendTxGas`, `Estimated gas of ${gas.toString()}`)
    return gas
  } catch (error) {
    throw Error(ErrorMessages.CALCULATE_FEE_FAILED)
  }
}

export async function getSendFee(
  account: string,
  currency: CURRENCY_ENUM,
  params: BasicTokenTransfer,
  includeDekFee: boolean = false
) {
  try {
    let gas = await getSendTxGas(account, currency, params)
    if (includeDekFee) {
      const dekGas = await getRegisterDekTxGas(account, currency)
      gas = gas.plus(dekGas)
    }

    return calculateFee(gas)
  } catch (error) {
    throw error
  }
}

export function* watchQrCodeDetections() {
  while (true) {
    const action: HandleBarcodeDetectedAction = yield take(Actions.BARCODE_DETECTED)
    Logger.debug(TAG, 'Barcode detected in watcher')
    const addressToE164Number = yield select(addressToE164NumberSelector)
    const recipientCache = yield select(recipientCacheSelector)
    const e164NumberToAddress = yield select(e164NumberToAddressSelector)
    const isOutgoingPaymentRequest = action.isOutgoingPaymentRequest
    let secureSendTxData
    let requesterAddress

    if (action.scanIsForSecureSend) {
      secureSendTxData = action.transactionData
      requesterAddress = action.requesterAddress
    }

    try {
      yield call(
        handleBarcode,
        action.data,
        addressToE164Number,
        recipientCache,
        e164NumberToAddress,
        secureSendTxData,
        isOutgoingPaymentRequest,
        requesterAddress
      )
    } catch (error) {
      Logger.error(TAG, 'Error handling the barcode', error)
    }
  }
}

export function* watchQrCodeShare() {
  while (true) {
    const action: ShareQRCodeAction = yield take(Actions.QRCODE_SHARE)
    try {
      const result = yield call(shareSVGImage, action.qrCodeSvg)
      // Note: when user cancels the share sheet, result contains {"dismissedAction":true}
      Logger.info(TAG, 'Share done', JSON.stringify(result))
    } catch (error) {
      Logger.error(TAG, 'Error sharing qr code', error)
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

    const ownAddress: string = yield select(currentAccountSelector)
    // Ensure comment encryption is possible by first ensuring the account's DEK has been registered
    // For most users, this happens during redeem invite or verification. This is a fallback.
    yield call(registerAccountDek, ownAddress)
    const encryptedComment = yield call(encryptComment, comment, recipientAddress, ownAddress, true)

    const context = newTransactionContext(TAG, 'Send payment')
    switch (currency) {
      case CURRENCY_ENUM.GOLD: {
        yield put(
          transferGoldToken({
            recipientAddress,
            amount: amount.toString(),
            comment: encryptedComment,
            context,
          })
        )
        break
      }
      case CURRENCY_ENUM.DOLLAR: {
        yield put(
          transferStableToken({
            recipientAddress,
            amount: amount.toString(),
            comment: encryptedComment,
            context,
          })
        )
        break
      }
      default: {
        throw new Error(`Sending currency ${currency} not yet supported`)
      }
    }
    ValoraAnalytics.track(SendEvents.send_tx_complete, {
      txId: context.id,
      recipientAddress,
      amount: amount.toString(),
      currency,
    })
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
    yield call(getConnectedUnlockedAccount)

    if (!recipient?.e164PhoneNumber && !recipient?.address) {
      throw new Error("Can't send to recipient without valid e164PhoneNumber or address")
    }

    if (recipientAddress) {
      yield call(sendPayment, recipientAddress, amount, comment, CURRENCY_ENUM.DOLLAR)
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
