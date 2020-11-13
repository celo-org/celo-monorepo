import { CeloTransactionObject } from '@celo/contractkit'
import { UnlockableWallet } from '@celo/contractkit/lib/wallets/wallet'
import { privateKeyToAddress } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'
import { Platform, Share } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { generateSecureRandom } from 'react-native-securerandom'
import SendIntentAndroid from 'react-native-send-intent'
import SendSMS from 'react-native-sms'
import {
  all,
  call,
  delay,
  put,
  race,
  spawn,
  take,
  TakeEffect,
  takeLeading,
} from 'redux-saga/effects'
import { Actions as AccountActions } from 'src/account/actions'
import { showError, showMessage } from 'src/alert/actions'
import { InviteEvents, OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { WEB_LINK } from 'src/brandingConfig'
import { APP_STORE_ID } from 'src/config'
import { transferEscrowedPayment } from 'src/escrow/actions'
import { calculateFee } from 'src/fees/saga'
import { generateShortInviteLink } from 'src/firebase/dynamicLinks'
import { features } from 'src/flags'
import { CURRENCY_ENUM, UNLOCK_DURATION } from 'src/geth/consts'
import { refreshAllBalances } from 'src/home/actions'
import i18n from 'src/i18n'
import { updateE164PhoneNumberAddresses } from 'src/identity/actions'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import {
  Actions,
  InviteBy,
  InviteDetails,
  RedeemInviteAction,
  redeemInviteFailure,
  redeemInviteSuccess,
  SendInviteAction,
  sendInviteFailure,
  sendInviteSuccess,
  SENTINEL_INVITE_COMMENT,
  storeInviteeData,
} from 'src/invite/actions'
import { createInviteCode } from 'src/invite/utils'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getPasswordSaga } from 'src/pincode/authentication'
import { getSendTxGas } from 'src/send/saga'
import { fetchDollarBalance, transferStableToken } from 'src/stableToken/actions'
import { createTokenTransferTransaction, fetchTokenBalanceInWeiWithRetry } from 'src/tokens/saga'
import { waitForTransactionWithId } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { getContractKitAsync, getWallet, getWeb3 } from 'src/web3/contracts'
import { registerAccountDek } from 'src/web3/dataEncryptionKey'
import { getOrCreateAccount, waitWeb3LastBlock } from 'src/web3/saga'

const TAG = 'invite/saga'
export const REDEEM_INVITE_TIMEOUT = 1.5 * 60 * 1000 // 1.5 minutes
export const INVITE_FEE = '0.30'
// TODO: Extract offline gas estimation into an independent library.
// Hardcoding estimate at 1/2 cent. Fees are currently an order of magnitude smaller ($0.0003)
const SEND_TOKEN_FEE_ESTIMATE = new BigNumber(0.005)
// Transfer for invite flow consistently takes 191775 gas. 200k is rounded up from there.
const SEND_TOKEN_GAS_ESTIMATE = 200000

export async function getInviteTxGas(
  account: string,
  currency: CURRENCY_ENUM,
  amount: BigNumber.Value,
  comment: string
) {
  try {
    const contractKit = await getContractKitAsync()
    const escrowContract = await contractKit.contracts.getEscrow()
    return getSendTxGas(account, currency, {
      amount,
      comment,
      recipientAddress: escrowContract.address,
    })
  } catch (error) {
    throw error
  }
}

export async function getInviteFee(
  account: string,
  currency: CURRENCY_ENUM,
  amount: string,
  comment: string
) {
  try {
    const gas = await getInviteTxGas(account, currency, amount, comment)
    return (await calculateFee(gas)).plus(getInvitationVerificationFeeInWei())
  } catch (error) {
    throw error
  }
}

export function getInvitationVerificationFeeInDollars() {
  const inviteFee = features.ESCROW_WITHOUT_CODE ? 0 : INVITE_FEE
  return new BigNumber(inviteFee)
}

export function getInvitationVerificationFeeInWei() {
  const inviteFee = features.ESCROW_WITHOUT_CODE ? 0 : INVITE_FEE
  return new BigNumber(inviteFee).multipliedBy(1e18)
}

export async function generateInviteLink(inviteCode?: string) {
  let bundleId = DeviceInfo.getBundleId()
  bundleId = bundleId.replace(/\.(debug|dev)$/g, '.alfajores')

  // trying to fetch appStoreId needed to build a dynamic link
  const shortUrl = await generateShortInviteLink({
    link: `https://valoraapp.com/${inviteCode ? `?invite-code=${inviteCode}` : ''}`,
    appStoreId: APP_STORE_ID,
    bundleId,
  })

  return shortUrl
}

export async function sendSms(toPhone: string, msg: string) {
  return new Promise((resolve, reject) => {
    try {
      if (Platform.OS === 'android') {
        SendIntentAndroid.sendSms(toPhone, msg)
        resolve()
      } else {
        // react-native-sms types are incorrect
        // react-native-sms doesn't seem to work on Xcode emulator but works on device
        // tslint:disable-next-line: no-floating-promises
        SendSMS.send(
          {
            body: msg,
            recipients: [toPhone],
          },
          (completed, cancelled, error) => {
            if (!completed) {
              reject(new Error(`Couldn't send sms: isCancelled: ${cancelled} isError: ${error}`))
            } else {
              resolve()
            }
          }
        )
      }
    } catch (e) {
      reject(e)
    }
  })
}

export function* sendInvite(
  e164Number: string,
  inviteMode: InviteBy,
  amount?: BigNumber,
  currency?: CURRENCY_ENUM
) {
  const escrowIncluded = !!amount

  try {
    ValoraAnalytics.track(
      features.KOMENCI ? InviteEvents.invite_start : InviteEvents.invite_tx_start,
      { escrowIncluded, amount: amount?.toString() }
    )
    const web3 = yield call(getWeb3)
    const randomness: Uint8Array = yield call(generateSecureRandom, 64)
    const temporaryWalletAccount = web3.eth.accounts.create(
      Buffer.from(randomness).toString('ascii')
    )
    const temporaryAddress = temporaryWalletAccount.address
    const inviteCode = createInviteCode(temporaryWalletAccount.privateKey)

    const link = features.ESCROW_WITHOUT_CODE
      ? WEB_LINK
      : yield call(generateInviteLink, inviteCode)

    const messageProp = amount
      ? 'sendFlow7:inviteWithEscrowedPayment'
      : 'sendFlow7:inviteWithoutPayment'
    const message = i18n.t(messageProp, {
      amount: amount?.toString(),
      link,
    })

    if (features.ESCROW_WITHOUT_CODE) {
      if (amount) {
        yield call(initiateEscrowTransfer, e164Number, amount)
      }
      yield call(Share.share, { message })
      return
    }

    const inviteDetails: InviteDetails = {
      timestamp: Date.now(),
      e164Number,
      tempWalletAddress: temporaryAddress.toLowerCase(),
      tempWalletPrivateKey: temporaryWalletAccount.privateKey,
      tempWalletRedeemed: false, // no logic in place to toggle this yet
      inviteCode,
      inviteLink: link,
    }

    // Store the Temp Address locally so we know which transactions were invites
    yield put(storeInviteeData(inviteDetails))

    if (!features.KOMENCI) {
      const context = newTransactionContext(TAG, 'Transfer to invite address')
      yield put(
        transferStableToken({
          recipientAddress: temporaryAddress,
          amount: INVITE_FEE,
          comment: SENTINEL_INVITE_COMMENT,
          context,
        })
      )
      yield call(waitForTransactionWithId, context.id)
      ValoraAnalytics.track(InviteEvents.invite_tx_complete, { escrowIncluded })
      Logger.debug(TAG + '@sendInviteSaga', 'Sent money to new wallet')
    }

    // If this invitation has a payment attached to it, send the payment to the escrow.
    if (currency === CURRENCY_ENUM.DOLLAR && amount) {
      yield call(initiateEscrowTransfer, e164Number, amount, temporaryAddress)
    } else {
      Logger.error(TAG, 'Currently only dollar escrow payments are allowed')
    }

    const addressToE164Number = { [temporaryAddress.toLowerCase()]: e164Number }
    yield put(updateE164PhoneNumberAddresses({}, addressToE164Number))
    if (features.KOMENCI) {
      yield call(Share.share, { message })
      ValoraAnalytics.track(InviteEvents.invite_complete, {
        escrowIncluded,
        amount: amount?.toString(),
      })
    } else {
      yield call(Share.share, { message })
    }
  } catch (e) {
    ValoraAnalytics.track(
      features.KOMENCI ? InviteEvents.invite_error : InviteEvents.invite_tx_error,
      { escrowIncluded, error: e.message, amount: amount?.toString() }
    )
    Logger.error(TAG, 'Send invite error: ', e)
    throw e
  }
}

export function* initiateEscrowTransfer(
  e164Number: string,
  amount: BigNumber,
  temporaryAddress?: string
) {
  const context = newTransactionContext(TAG, 'Escrow funds')
  try {
    const phoneHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
    yield put(transferEscrowedPayment(phoneHashDetails, amount, context, temporaryAddress))
    yield call(waitForTransactionWithId, context.id)
    Logger.debug(TAG + '@sendInviteSaga', 'Escrowed money to new wallet')
  } catch (e) {
    Logger.error(TAG, 'Error sending payment to unverified user: ', e)
    yield put(showError(ErrorMessages.ESCROW_TRANSFER_FAILED))
  }
}

// TODO: Delete this if we don't decide to use it again
// function* navigateToInviteMessageApp(e164Number: string, inviteMode: InviteBy, message: string) {
//   try {
//     switch (inviteMode) {
//       case InviteBy.SMS: {
//         ValoraAnalytics.track(InviteEvents.invite_method_sms)
//         yield call(sendSms, e164Number, message)
//         break
//       }
//       case InviteBy.WhatsApp: {
//         ValoraAnalytics.track(InviteEvents.invite_method_whatsapp)
//         yield Linking.openURL(`https://wa.me/${e164Number}?text=${encodeURIComponent(message)}`)
//         break
//       }
//       default:
//         throw new Error('Unsupported invite mode type: ' + inviteMode)
//     }

//     // Wait a little bit so it has time to switch to Sms/WhatsApp before updating the UI
//     yield delay(100)
//   } catch (error) {
//     // Not a critical error, allow saga to proceed
//     Logger.error(TAG + '@navigateToInviteMessageApp', `Failed to launch message app ${inviteMode}`)
//     ValoraAnalytics.track(InviteEvents.invite_method_error, { error: error.message })
//     yield put(showError(ErrorMessages.INVITE_OPEN_APP_FAILED, ALERT_BANNER_DURATION * 1.5))
//     // TODO(Rossy): We need a UI for users to review their sent invite codes and
//     // redeem them in case they are unused or unsent like this case, see #2639
//     // For now just copying the code to the clipboard and notifying user
//     Clipboard.setString(message)
//   }
// }

function* sendInviteSaga(action: SendInviteAction) {
  const { e164Number, inviteMode, amount, currency } = action

  try {
    yield call(sendInvite, e164Number, inviteMode, amount, currency)
    yield put(showMessage(i18n.t('inviteSent', { ns: 'inviteFlow11' }) + ' ' + e164Number))
    navigateHome()
    yield put(sendInviteSuccess())
  } catch (e) {
    Logger.error(TAG, 'Send invite error: ', e)
    yield put(showError(ErrorMessages.INVITE_FAILED))
    yield put(sendInviteFailure(ErrorMessages.INVITE_FAILED))
    navigateHome()
  }
}

export function* redeemInviteSaga({ tempAccountPrivateKey }: RedeemInviteAction) {
  yield call(waitWeb3LastBlock)
  Logger.debug(TAG, 'Starting Redeem Invite')

  const {
    result,
    cancel,
    timeout,
  }: {
    result: { success: true; newAccount: string } | { success: false } | undefined
    cancel: TakeEffect | undefined
    timeout: true | undefined
  } = yield race({
    result: call(doRedeemInvite, tempAccountPrivateKey),
    cancel: take(AccountActions.CANCEL_CREATE_OR_RESTORE_ACCOUNT),
    timeout: delay(REDEEM_INVITE_TIMEOUT),
  })

  if (result?.success === true) {
    Logger.debug(TAG, 'Redeem Invite completed successfully')
    yield put(redeemInviteSuccess())
    yield put(refreshAllBalances())
    navigate(Screens.VerificationEducationScreen)
    // Note: We are ok with this succeeding or failing silently in the background,
    // user will have another chance to register DEK when sending their first tx
    yield spawn(registerAccountDek, result.newAccount)
  } else if (result?.success === false) {
    Logger.debug(TAG, 'Redeem Invite failed')
    yield put(redeemInviteFailure())
  } else if (cancel) {
    ValoraAnalytics.track(OnboardingEvents.invite_redeem_cancel)
    Logger.debug(TAG, 'Redeem Invite cancelled')
  } else if (timeout) {
    Logger.debug(TAG, 'Redeem Invite timed out')
    ValoraAnalytics.track(OnboardingEvents.invite_redeem_timeout)
    yield put(redeemInviteFailure())
    yield put(showError(ErrorMessages.REDEEM_INVITE_TIMEOUT))
  }
}

export function* doRedeemInvite(tempAccountPrivateKey: string) {
  try {
    ValoraAnalytics.track(OnboardingEvents.invite_redeem_start)
    const tempAccount = privateKeyToAddress(tempAccountPrivateKey)
    Logger.debug(TAG + '@doRedeemInvite', 'Invite code contains temp account', tempAccount)

    const [tempAccountBalanceWei, newAccount]: [BigNumber, string] = yield all([
      call(fetchTokenBalanceInWeiWithRetry, CURRENCY_ENUM.DOLLAR, tempAccount),
      call(getOrCreateAccount),
      call(addTempAccountToWallet, tempAccountPrivateKey),
    ])

    if (tempAccountBalanceWei.isLessThanOrEqualTo(0)) {
      ValoraAnalytics.track(OnboardingEvents.invite_redeem_error, {
        error: 'Empty invite',
      })
      yield put(showError(ErrorMessages.EMPTY_INVITE_CODE))
      return { success: false }
    }

    ValoraAnalytics.track(OnboardingEvents.invite_redeem_move_funds_start)
    yield call(
      moveAllFundsFromAccount,
      tempAccount,
      tempAccountBalanceWei,
      newAccount,
      CURRENCY_ENUM.DOLLAR,
      SENTINEL_INVITE_COMMENT
    )
    ValoraAnalytics.track(OnboardingEvents.invite_redeem_move_funds_complete)

    yield put(fetchDollarBalance())
    ValoraAnalytics.track(OnboardingEvents.invite_redeem_complete)
    return { success: true, newAccount }
  } catch (e) {
    Logger.error(TAG + '@doRedeemInvite', 'Failed to redeem invite', e)
    ValoraAnalytics.track(OnboardingEvents.invite_redeem_error, { error: e.message })
    if (e.message in ErrorMessages) {
      yield put(showError(e.message))
    } else {
      yield put(showError(ErrorMessages.REDEEM_INVITE_FAILED))
    }
    return { success: false }
  }
}

function* addTempAccountToWallet(tempAccountPrivateKey: string) {
  Logger.debug(TAG + '@addTempAccountToWallet', 'Attempting to add temp wallet')
  try {
    // Import account into the local geth node
    const wallet: UnlockableWallet = yield call(getWallet)
    const account = privateKeyToAddress(tempAccountPrivateKey)
    const password: string = yield call(getPasswordSaga, account, false, true)
    const tempAccount = yield call([wallet, wallet.addAccount], tempAccountPrivateKey, password)
    Logger.debug(TAG + '@addTempAccountToWallet', 'Account added', tempAccount)
  } catch (e) {
    if (e.message === ErrorMessages.GETH_ACCOUNT_ALREADY_EXISTS) {
      Logger.warn(TAG + '@addTempAccountToWallet', 'Account already exists, using it')
      return
    }
    Logger.error(TAG + '@addTempAccountToWallet', 'Failed to add account', e)
    throw new Error('Failed to add temp account to wallet')
  }
}

export function* moveAllFundsFromAccount(
  account: string,
  accountBalanceWei: BigNumber,
  toAccount: string,
  currency: CURRENCY_ENUM,
  comment: string
) {
  Logger.debug(TAG + '@moveAllFundsFromAccount', 'Unlocking account')
  const wallet: UnlockableWallet = yield call(getWallet)
  const password: string = yield call(getPasswordSaga, account, false, true)
  yield call([wallet, wallet.unlockAccount], account, password, UNLOCK_DURATION)

  Logger.debug(
    TAG + '@moveAllFundsFromAccount',
    `Temp account balance is ${accountBalanceWei.toString()}. Calculating withdrawal fee`
  )
  const tempAccountBalance = divideByWei(accountBalanceWei)

  // Temporarily hardcoding fee estimate to save time on gas estimation
  const sendTokenFee = SEND_TOKEN_FEE_ESTIMATE
  // const sendTokenFeeInWei: BigNumber = yield call(getSendFee, account, currency, {
  //   recipientAddress: toAccount,
  //   amount: tempAccountBalance,
  //   comment,
  // })
  // // Inflate fee by 10% to harden against minor gas changes
  // const sendTokenFee = divideByWei(sendTokenFeeInWei).times(1.1)

  if (sendTokenFee.isGreaterThanOrEqualTo(tempAccountBalance)) {
    throw new Error('Fee is too large for amount in temp wallet')
  }

  const netSendAmount = tempAccountBalance.minus(sendTokenFee)
  Logger.debug(
    TAG + '@moveAllFundsFromAccount',
    `Withdrawing net amount of ${netSendAmount.toString()}`
  )

  const tx: CeloTransactionObject<boolean> = yield call(createTokenTransferTransaction, currency, {
    recipientAddress: toAccount,
    amount: netSendAmount,
    comment,
  })

  const context = newTransactionContext(TAG, 'Transfer from temp wallet')
  // Temporarily hardcoding gas estimate to save time on estimation
  yield call(
    sendTransaction,
    tx.txo,
    account,
    context,
    SEND_TOKEN_GAS_ESTIMATE,
    AccountActions.CANCEL_CREATE_OR_RESTORE_ACCOUNT
  )
  Logger.debug(TAG + '@moveAllFundsFromAccount', 'Done withdrawal')
}

export function* watchSendInvite() {
  yield takeLeading(Actions.SEND_INVITE, sendInviteSaga)
}

export function* watchRedeemInvite() {
  yield takeLeading(Actions.REDEEM_INVITE, redeemInviteSaga)
}

export function* inviteSaga() {
  yield spawn(watchSendInvite)
  yield spawn(watchRedeemInvite)
}
