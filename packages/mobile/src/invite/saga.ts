import { CeloTransactionObject } from '@celo/contractkit'
import { trimLeading0x } from '@celo/utils/src/address'
import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import BigNumber from 'bignumber.js'
import { Clipboard, Linking, Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { asyncRandomBytes } from 'react-native-secure-randombytes'
import SendIntentAndroid from 'react-native-send-intent'
import SendSMS from 'react-native-sms'
import { call, delay, put, race, select, spawn, take, takeLeading } from 'redux-saga/effects'
import { showError, showMessage } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ALERT_BANNER_DURATION, USE_PHONE_NUMBER_PRIVACY } from 'src/config'
import { transferEscrowedPayment } from 'src/escrow/actions'
import { calculateFee } from 'src/fees/saga'
import { generateShortInviteLink } from 'src/firebase/dynamicLinks'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import { setHasSeenVerificationNux, updateE164PhoneNumberAddresses } from 'src/identity/actions'
import { fetchPhoneHashPrivate } from 'src/identity/privacy'
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
import { navigateHome } from 'src/navigator/NavigationService'
import { getSendFee, getSendTxGas } from 'src/send/saga'
import { fetchDollarBalance, transferStableToken } from 'src/stableToken/actions'
import { createTokenTransferTransaction, fetchTokenBalanceInWeiWithRetry } from 'src/tokens/saga'
import { generateStandbyTransactionId } from 'src/transactions/actions'
import { waitForTransactionWithId } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import { getAppStoreId } from 'src/utils/appstore'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import {
  addLocalAccount,
  getContractKit,
  getContractKitOutsideGenerator,
  web3ForUtils,
} from 'src/web3/contracts'
import { getConnectedUnlockedAccount, getOrCreateAccount, waitWeb3LastBlock } from 'src/web3/saga'
import { fornoSelector } from 'src/web3/selectors'

const TAG = 'invite/saga'
export const TEMP_PW = 'ce10'
export const REDEEM_INVITE_TIMEOUT = 2 * 60 * 1000 // 2 minutes
const INVITE_FEE = '0.25'

export async function getInviteTxGas(
  account: string,
  currency: CURRENCY_ENUM,
  amount: BigNumber.Value,
  comment: string
) {
  const contractKit = await getContractKitOutsideGenerator()
  const escrowContract = await contractKit.contracts.getEscrow()
  return getSendTxGas(account, currency, {
    amount,
    comment,
    recipientAddress: escrowContract.address,
  })
}

export async function getInviteFee(
  account: string,
  currency: CURRENCY_ENUM,
  amount: string,
  comment: string
) {
  const gas = await getInviteTxGas(account, currency, amount, comment)
  return (await calculateFee(gas)).plus(getInvitationVerificationFeeInWei())
}

export function getInvitationVerificationFeeInDollars() {
  return new BigNumber(INVITE_FEE)
}

export function getInvitationVerificationFeeInWei() {
  return new BigNumber(web3ForUtils.utils.toWei(INVITE_FEE))
}

export async function generateInviteLink(inviteCode: string) {
  let bundleId = DeviceInfo.getBundleId()
  bundleId = bundleId.replace(/\.(debug|dev)$/g, '.alfajores')

  // trying to fetch appStoreId needed to build a dynamic link
  let appStoreId
  try {
    appStoreId = await getAppStoreId(bundleId)
  } catch (error) {
    Logger.error(TAG, 'Failed to load AppStore ID: ' + error.toString())
  }

  const shortUrl = await generateShortInviteLink({
    link: `https://celo.org/build/wallet?invite-code=${inviteCode}`,
    appStoreId,
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
  yield call(getConnectedUnlockedAccount)
  try {
    const contractKit = yield call(getContractKit)
    const randomness = yield call(asyncRandomBytes, 64)
    const temporaryWalletAccount = contractKit.web3.eth.accounts.create(
      randomness.toString('ascii')
    )
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

    const txId = generateStandbyTransactionId(temporaryAddress)

    yield put(
      transferStableToken({
        recipientAddress: temporaryAddress,
        amount: INVITE_FEE,
        comment: SENTINEL_INVITE_COMMENT,
        txId,
      })
    )

    yield call(waitForTransactionWithId, txId)
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
    Logger.error(TAG, 'Send invite error: ', e)
    throw e
  }
}

function* initiateEscrowTransfer(temporaryAddress: string, e164Number: string, amount: BigNumber) {
  const escrowTxId = generateStandbyTransactionId(temporaryAddress + '-escrow')
  try {
    let phoneHash: string
    if (USE_PHONE_NUMBER_PRIVACY) {
      const phoneHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
      phoneHash = phoneHashDetails.phoneHash
    } else {
      phoneHash = getPhoneHash(e164Number)
    }
    yield put(transferEscrowedPayment(phoneHash, amount, temporaryAddress, escrowTxId))
    yield call(waitForTransactionWithId, escrowTxId)
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
        yield call(sendSms, e164Number, message)
        break
      }
      case InviteBy.WhatsApp: {
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

export function* redeemInviteSaga({ inviteCode }: RedeemInviteAction) {
  yield call(waitWeb3LastBlock)
  Logger.debug(TAG, 'Starting Redeem Invite')

  const { result, timeout } = yield race({
    result: call(doRedeemInvite, inviteCode),
    timeout: delay(REDEEM_INVITE_TIMEOUT),
  })

  if (result === true) {
    Logger.debug(TAG, 'Redeem Invite completed successfully')
    yield put(redeemInviteSuccess())
    CeloAnalytics.track(CustomEventNames.redeem_invite_success)
  } else if (result === false) {
    Logger.debug(TAG, 'Redeem Invite failed')
    CeloAnalytics.track(CustomEventNames.redeem_invite_failed)
    yield put(redeemInviteFailure())
  } else if (timeout) {
    Logger.debug(TAG, 'Redeem Invite timed out')
    CeloAnalytics.track(CustomEventNames.redeem_invite_timed_out)
    yield put(redeemInviteFailure())
    yield put(showError(ErrorMessages.REDEEM_INVITE_TIMEOUT))
  }
}

export function* doRedeemInvite(inviteCode: string) {
  try {
    const contractKit = yield call(getContractKit)
    const tempAccount = contractKit.web3.eth.accounts.privateKeyToAccount(inviteCode).address
    Logger.debug(TAG + '@doRedeemInvite', 'Invite code contains temp account', tempAccount)
    const tempAccountBalanceWei: BigNumber = yield call(
      fetchTokenBalanceInWeiWithRetry,
      CURRENCY_ENUM.DOLLAR,
      tempAccount
    )
    if (tempAccountBalanceWei.isLessThanOrEqualTo(0)) {
      yield put(showError(ErrorMessages.EMPTY_INVITE_CODE))
      return false
    }

    const newAccount = yield call(getOrCreateAccount)
    yield call(addTempAccountToWallet, inviteCode)
    yield call(withdrawFundsFromTempAccount, tempAccount, tempAccountBalanceWei, newAccount)
    yield put(fetchDollarBalance())
    return true
  } catch (e) {
    Logger.error(TAG + '@doRedeemInvite', 'Failed to redeem invite', e)
    if (e.message in ErrorMessages) {
      yield put(showError(e.message))
    } else {
      yield put(showError(ErrorMessages.REDEEM_INVITE_FAILED))
    }
    return false
  }
}

export function* skipInvite() {
  yield take(Actions.SKIP_INVITE)
  Logger.debug(TAG + '@skipInvite', 'Skip invite action taken, creating account')
  try {
    yield call(getOrCreateAccount)
    yield put(setHasSeenVerificationNux(true))
    Logger.debug(TAG + '@skipInvite', 'Done skipping invite')
    navigateHome()
  } catch (e) {
    Logger.error(TAG, 'Failed to skip invite', e)
    yield put(showError(ErrorMessages.ACCOUNT_SETUP_FAILED))
  }
}

function* addTempAccountToWallet(inviteCode: string) {
  Logger.debug(TAG + '@addTempAccountToWallet', 'Attempting to add temp wallet')
  try {
    const contractKit = yield call(getContractKit)
    let tempAccount: string | null = null
    const fornoMode = yield select(fornoSelector)
    if (fornoMode) {
      tempAccount = contractKit.web3.eth.accounts.privateKeyToAccount(inviteCode).address
      Logger.debug(
        TAG + '@redeemInviteCode',
        'web3 is connected:',
        String(yield call(contractKit.web3.eth.net.isListening))
      )
      addLocalAccount(inviteCode)
    } else {
      // Import account into the local geth node
      tempAccount = yield call(
        contractKit.web3.eth.personal.importRawKey,
        trimLeading0x(inviteCode),
        TEMP_PW
      )
    }
    Logger.debug(TAG + '@addTempAccountToWallet', 'Account added', tempAccount!)
  } catch (e) {
    if (e.toString().includes('account already exists')) {
      Logger.warn(TAG + '@addTempAccountToWallet', 'Account already exists, using it')
      return
    }
    Logger.error(TAG + '@addTempAccountToWallet', 'Failed to add account', e)
    throw new Error('Failed to add temp account to wallet')
  }
}

export function* withdrawFundsFromTempAccount(
  tempAccount: string,
  tempAccountBalanceWei: BigNumber,
  newAccount: string
) {
  Logger.debug(TAG + '@withdrawFundsFromTempAccount', 'Unlocking temporary account')
  const fornoMode = yield select(fornoSelector)
  const contractKit = yield call(getContractKit)
  if (!fornoMode) {
    yield call(contractKit.web3.eth.personal.unlockAccount, tempAccount, TEMP_PW, 600)
  }

  Logger.debug(
    TAG + '@withdrawFundsFromTempAccount',
    `Temp account balance is ${tempAccountBalanceWei.toString()}. Calculating withdrawal fee`
  )
  const tempAccountBalance = divideByWei(tempAccountBalanceWei)
  const sendTokenFeeInWei: BigNumber = yield call(getSendFee, tempAccount, CURRENCY_ENUM.DOLLAR, {
    recipientAddress: newAccount,
    amount: tempAccountBalance,
    comment: SENTINEL_INVITE_COMMENT,
  })
  // Inflate fee by 10% to harden against minor gas changes
  const sendTokenFee = divideByWei(sendTokenFeeInWei).times(1.1)

  if (sendTokenFee.isGreaterThanOrEqualTo(tempAccountBalance)) {
    throw new Error('Fee is too large for amount in temp wallet')
  }

  const netSendAmount = tempAccountBalance.minus(sendTokenFee)
  Logger.debug(
    TAG + '@withdrawFundsFromTempAccount',
    `Withdrawing net amount of ${netSendAmount.toString()}`
  )

  const tx: CeloTransactionObject<boolean> = yield call(
    createTokenTransferTransaction,
    CURRENCY_ENUM.DOLLAR,
    {
      recipientAddress: newAccount,
      amount: netSendAmount,
      comment: SENTINEL_INVITE_COMMENT,
    }
  )

  yield call(sendTransaction, tx.txo, tempAccount, TAG, 'Transfer from temp wallet')
  Logger.debug(TAG + '@withdrawFundsFromTempAccount', 'Done withdrawal')
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
