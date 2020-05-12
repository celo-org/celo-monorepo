import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import { call, put, select, spawn, take, takeLatest, takeLeading } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { calculateFee } from 'src/fees/saga'
import { completePaymentRequest } from 'src/firebase/actions'
import { features } from 'src/flags'
import { transferGoldToken } from 'src/goldToken/actions'
import { encryptComment } from 'src/identity/commentKey'
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
  ValidateRecipientAddressAction,
  validateRecipientAddressFailure,
  validateRecipientAddressSuccess,
} from 'src/send/actions'
import { checkForValidationErrorsAndReturnMatch } from 'src/send/utils'
import { transferStableToken } from 'src/stableToken/actions'
import {
  BasicTokenTransfer,
  createTokenTransferTransaction,
  getCurrencyAddress,
} from 'src/tokens/saga'
import { generateStandbyTransactionId } from 'src/transactions/actions'
import Logger from 'src/utils/Logger'
import { userAddressSelector } from 'src/web3/reducer'
import { currentAccountSelector } from 'src/web3/selectors'
import { estimateGas } from 'src/web3/utils'

const TAG = 'send/saga'
const TAG2 = 'secureSend/saga'

export async function getSendTxGas(
  account: string,
  currency: CURRENCY_ENUM,
  params: BasicTokenTransfer
) {
  Logger.debug(`${TAG}/getSendTxGas`, 'Getting gas estimate for send tx')
  const tx = await createTokenTransferTransaction(currency, params)
  const txParams = { from: account, feeCurrency: await getCurrencyAddress(currency) }
  const gas = await estimateGas(tx.txo, txParams)
  Logger.debug(`${TAG}/getSendTxGas`, `Estimated gas of ${gas.toString()}`)
  return gas
}

export async function getSendFee(
  account: string,
  currency: CURRENCY_ENUM,
  params: BasicTokenTransfer
) {
  const gas = await getSendTxGas(account, currency, params)
  return calculateFee(gas)
}

export function* watchQrCodeDetections() {
  while (true) {
    const action = yield take(Actions.BARCODE_DETECTED)
    Logger.debug(TAG, 'Barcode detected in watcher')
    const addressToE164Number = yield select(addressToE164NumberSelector)
    const recipientCache = yield select(recipientCacheSelector)
    const e164NumberToAddress = yield select(e164NumberToAddressSelector)
    try {
      yield call(
        handleBarcode,
        action.data,
        addressToE164Number,
        recipientCache,
        e164NumberToAddress,
        action.scanIsForSecureSend,
        action.transactionData
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
  } catch (error) {
    Logger.error(`${TAG}/sendPayment`, 'Could not send payment', error)
    throw error
  }
}

function* sendPaymentOrInviteSaga({
  amount,
  reason,
  recipient,
  recipientAddress,
  inviteMethod,
  firebasePendingRequestUid,
}: SendPaymentOrInviteAction) {
  try {
    recipientAddress
      ? CeloAnalytics.track(CustomEventNames.send_dollar_confirm)
      : CeloAnalytics.track(CustomEventNames.send_invite)
    if (!recipient || (!recipient.e164PhoneNumber && !recipient.address)) {
      throw new Error("Can't send to recipient without valid e164 number or address")
    }

    const ownAddress = yield select(currentAccountSelector)
    const comment = features.USE_COMMENT_ENCRYPTION
      ? yield call(encryptComment, reason, recipientAddress, ownAddress)
      : reason

    if (recipientAddress) {
      yield call(sendPayment, recipientAddress, amount, comment, CURRENCY_ENUM.DOLLAR)
      CeloAnalytics.track(CustomEventNames.send_dollar_transaction)
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
    yield put(sendPaymentOrInviteSuccess())
  } catch (e) {
    yield put(showError(ErrorMessages.SEND_PAYMENT_FAILED))
    yield put(sendPaymentOrInviteFailure())
  }
}

export function* validateRecipientAddressSaga({
  userInputOfFullAddressOrLastFourDigits,
  fullAddressValidationRequired,
  recipient,
}: ValidateRecipientAddressAction) {
  Logger.debug(TAG, 'Starting Recipient Address Validation')
  try {
    const userAddress = yield select(userAddressSelector)
    const e164NumberToAddress = yield select(e164NumberToAddressSelector)
    const { e164PhoneNumber } = recipient

    // should never happen, if it does it means there's an error passing through recipient object
    if (!e164PhoneNumber) {
      throw Error('There is no phone number associated with this recipient')
    }

    const possibleRecievingAddresses = e164NumberToAddress[e164PhoneNumber]
    // should never happen since secure send is initiated due to there being several possible addresses
    if (!possibleRecievingAddresses) {
      throw Error('There are no possible recipient addresses to validate against')
    }

    const validatedAddress = checkForValidationErrorsAndReturnMatch(
      userInputOfFullAddressOrLastFourDigits,
      possibleRecievingAddresses,
      userAddress,
      fullAddressValidationRequired
    )
    yield put(validateRecipientAddressSuccess(e164PhoneNumber, validatedAddress))
  } catch (error) {
    Logger.error(TAG2, 'Address validation error: ', error.message)
    yield put(showError(error.message))
    yield put(validateRecipientAddressFailure())
  }
}

export function* watchSendPaymentOrInvite() {
  yield takeLeading(Actions.SEND_PAYMENT_OR_INVITE, sendPaymentOrInviteSaga)
}

export function* watchValidateRecipientAddress() {
  yield takeLatest(Actions.VALIDATE_RECIPIENT_ADDRESS, validateRecipientAddressSaga)
}

export function* sendSaga() {
  yield spawn(watchQrCodeDetections)
  yield spawn(watchQrCodeShare)
  yield spawn(watchSendPaymentOrInvite)
  yield spawn(watchValidateRecipientAddress)
}
