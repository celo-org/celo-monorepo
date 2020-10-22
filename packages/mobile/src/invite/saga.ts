import { CeloTransactionObject } from '@celo/contractkit'
import { UnlockableWallet } from '@celo/contractkit/lib/wallets/wallet'
import { privateKeyToAddress } from '@celo/utils/src/address'
import Clipboard from '@react-native-community/clipboard'
import BigNumber from 'bignumber.js'
import { Linking, Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { asyncRandomBytes } from 'react-native-secure-randombytes'
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
import { ALERT_BANNER_DURATION, APP_STORE_ID } from 'src/config'
import { transferEscrowedPayment } from 'src/escrow/actions'
import { calculateFee } from 'src/fees/saga'
import { generateShortInviteLink } from 'src/firebase/dynamicLinks'
import { CURRENCY_ENUM, UNLOCK_DURATION } from 'src/geth/consts'
import { refreshAllBalances } from 'src/home/actions'
import i18n from 'src/i18n'
import { setHasSeenVerificationNux, updateE164PhoneNumberAddresses } from 'src/identity/actions'
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
  skipInviteFailure,
  skipInviteSuccess,
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
  return new BigNumber(INVITE_FEE)
}

export function getInvitationVerificationFeeInWei() {
  return new BigNumber(INVITE_FEE).multipliedBy(1e18)
}

export async function generateInviteLink(inviteCode: string) {
  let bundleId = DeviceInfo.getBundleId()
  bundleId = bundleId.replace(/\.(debug|dev)$/g, '.alfajores')

  // trying to fetch appStoreId needed to build a dynamic link
  const shortUrl = await generateShortInviteLink({
    link: `https://valoraapp.com/?invite-code=${inviteCode}`,
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
    ValoraAnalytics.track(InviteEvents.invite_tx_start, { escrowIncluded })
    const web3 = yield call(getWeb3)
    const randomness = yield call(asyncRandomBytes, 64)
    const temporaryWalletAccount = web3.eth.accounts.create(randomness.toString('ascii'))
    const temporaryAddress = temporaryWalletAccount.address
    const inviteCode = createInviteCode(temporaryWalletAccount.privateKey)

    const link = yield call(generateInviteLink, inviteCode)
    const message = i18n.t(
      amount ? 'sendFlow7:inviteSMSWithEscrowedPayment' : 'sendFlow7:inviteSMS',
      {
        code: inviteCode,
        link,
      }
    )

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

    // If this invitation has a payment attached to it, send the payment to the escrow.
    if (currency === CURRENCY_ENUM.DOLLAR && amount) {
      yield call(initiateEscrowTransfer, temporaryAddress, e164Number, amount)
    } else {
      Logger.error(TAG, 'Currently only dollar escrow payments are allowed')
    }

    const addressToE164Number = { [temporaryAddress.toLowerCase()]: e164Number }
    yield put(updateE164PhoneNumberAddresses({}, addressToE164Number))
    yield call(navigateToInviteMessageApp, e164Number, inviteMode, message)
  } catch (e) {
    ValoraAnalytics.track(InviteEvents.invite_tx_error, { escrowIncluded, error: e.message })
    Logger.error(TAG, 'Send invite error: ', e)
    throw e
  }
}

function* initiateEscrowTransfer(temporaryAddress: string, e164Number: string, amount: BigNumber) {
  const context = newTransactionContext(TAG, 'Escrow funds')
  try {
    let phoneHash: string
    const phoneHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
    phoneHash = phoneHashDetails.phoneHash
    yield put(transferEscrowedPayment(phoneHash, amount, temporaryAddress, context))
    yield call(waitForTransactionWithId, context.id)
    Logger.debug(TAG + '@sendInviteSaga', 'Escrowed money to new wallet')
  } catch (e) {
    Logger.error(TAG, 'Error sending payment to unverified user: ', e)
    yield put(showError(ErrorMessages.ESCROW_TRANSFER_FAILED))
  }
}

function* navigateToInviteMessageApp(e164Number: string, inviteMode: InviteBy, message: string) {
  try {
    switch (inviteMode) {
      case InviteBy.SMS: {
        ValoraAnalytics.track(InviteEvents.invite_method_sms)
        yield call(sendSms, e164Number, message)
        break
      }
      case InviteBy.WhatsApp: {
        ValoraAnalytics.track(InviteEvents.invite_method_whatsapp)
        yield Linking.openURL(`https://wa.me/${e164Number}?text=${encodeURIComponent(message)}`)
        break
      }
      default:
        throw new Error('Unsupported invite mode type: ' + inviteMode)
    }

    // Wait a little bit so it has time to switch to Sms/WhatsApp before updating the UI
    yield delay(100)
  } catch (error) {
    // Not a critical error, allow saga to proceed
    Logger.error(TAG + '@navigateToInviteMessageApp', `Failed to launch message app ${inviteMode}`)
    ValoraAnalytics.track(InviteEvents.invite_method_error, { error: error.message })
    yield put(showError(ErrorMessages.INVITE_OPEN_APP_FAILED, ALERT_BANNER_DURATION * 1.5))
    // TODO(Rossy): We need a UI for users to review their sent invite codes and
    // redeem them in case they are unused or unsent like this case, see #2639
    // For now just copying the code to the clipboard and notifying user
    Clipboard.setString(message)
  }
}

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

export function* skipInvite() {
  yield take(Actions.SKIP_INVITE)
  Logger.debug(TAG + '@skipInvite', 'Skip invite action taken, creating account')
  try {
    ValoraAnalytics.track(OnboardingEvents.invite_redeem_skip_start)
    yield call(getOrCreateAccount)
    // TODO: refactor this, the multiple dispatch calls are somewhat confusing
    // (`setHasSeenVerificationNux` though the user hasn't seen it),
    // we should prefer a more atomic approach with a meaningful action type
    yield put(refreshAllBalances())
    yield put(setHasSeenVerificationNux(true))
    Logger.debug(TAG + '@skipInvite', 'Done skipping invite')
    ValoraAnalytics.track(OnboardingEvents.invite_redeem_skip_complete)
    navigateHome()
    yield put(skipInviteSuccess())
  } catch (e) {
    Logger.error(TAG, 'Failed to skip invite', e)
    ValoraAnalytics.track(OnboardingEvents.invite_redeem_skip_error, { error: e.message })
    yield put(showError(ErrorMessages.ACCOUNT_SETUP_FAILED))
    yield put(skipInviteFailure())
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
  yield spawn(skipInvite)
}
