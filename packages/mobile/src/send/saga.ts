import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import { getGoldTokenContract, getStableTokenContract } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import { call, put, select, spawn, take, takeLeading } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { calculateFee } from 'src/fees/saga'
import { features } from 'src/flags'
import { transferGoldToken } from 'src/goldToken/actions'
import { encryptComment } from 'src/identity/commentKey'
import { addressToE164NumberSelector } from 'src/identity/reducer'
import { InviteBy } from 'src/invite/actions'
import { sendInvite } from 'src/invite/saga'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { handleBarcode, shareSVGImage } from 'src/qrcode/utils'
import { recipientCacheSelector } from 'src/recipients/reducer'
import {
  Actions,
  SendPaymentOrInviteAction,
  sendPaymentOrInviteFailure,
  sendPaymentOrInviteSuccess,
} from 'src/send/actions'
import { transferStableToken } from 'src/stableToken/actions'
import { BasicTokenTransfer, createTransaction } from 'src/tokens/saga'
import { generateStandbyTransactionId } from 'src/transactions/actions'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'send/saga'

export async function getSendTxGas(
  account: string,
  contractGetter: typeof getStableTokenContract | typeof getGoldTokenContract,
  params: BasicTokenTransfer
) {
  Logger.debug(`${TAG}/getSendTxGas`, 'Getting gas estimate for send tx')
  const tx = await createTransaction(contractGetter, params)
  const tokenContract = await contractGetter(web3)
  const txParams = { from: account, gasCurrency: tokenContract._address }
  const gas = new BigNumber(await tx.estimateGas(txParams))
  Logger.debug(`${TAG}/getSendTxGas`, `Estimated gas of ${gas.toString()}}`)
  return gas
}

export async function getSendFee(
  account: string,
  contractGetter: typeof getStableTokenContract | typeof getGoldTokenContract,
  params: BasicTokenTransfer
) {
  const gas = await getSendTxGas(account, contractGetter, params)
  return calculateFee(gas)
}

export function* watchQrCodeDetections() {
  while (true) {
    // TODO(Rossy) this gets called taken multiple times before a user can press the send button
    // Add de-bouncing logic
    const action = yield take(Actions.BARCODE_DETECTED)
    const addressToE164Number = yield select(addressToE164NumberSelector)
    const recipientCache = yield select(recipientCacheSelector)
    try {
      yield call(handleBarcode, action.data, addressToE164Number, recipientCache)
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

export function* sendPaymentOrInviteSaga({
  amount,
  reason,
  recipient,
  recipientAddress,
  inviteMethod,
  onConfirm,
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
        recipient.displayName,
        recipient.e164PhoneNumber,
        inviteMethod || InviteBy.SMS,
        amount,
        CURRENCY_ENUM.DOLLAR
      )
    }

    if (onConfirm) {
      // TODO(jeanregisser): rework this, we don't want a callback like this in sagas
      yield call(onConfirm)
    } else {
      yield call(navigate, Screens.WalletHome)
    }

    yield put(sendPaymentOrInviteSuccess())
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
