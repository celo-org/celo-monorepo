import { retryAsync } from '@celo/utils/src/async'
import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import { stripHexLeader } from '@celo/utils/src/signatureUtils'
import { getEscrowContract, getGoldTokenContract, getStableTokenContract } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import { Linking, Platform } from 'react-native'
import SendIntentAndroid from 'react-native-send-intent'
import VersionCheck from 'react-native-version-check'
import { call, delay, put, race, spawn, takeLeading } from 'redux-saga/effects'
import { showError, showMessage } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { transferEscrowedPayment } from 'src/escrow/actions'
import { calculateFee } from 'src/fees/saga'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import {
  Actions,
  InviteBy,
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
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { waitWeb3LastBlock } from 'src/networkInfo/saga'
import { getSendTxGas } from 'src/send/saga'
import { fetchDollarBalance, transferStableToken } from 'src/stableToken/actions'
import { createTransaction } from 'src/tokens/saga'
import { generateStandbyTransactionId } from 'src/transactions/actions'
import { waitForTransactionWithId } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import { dynamicLink } from 'src/utils/dynamicLink'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { getConnectedUnlockedAccount, getOrCreateAccount } from 'src/web3/saga'

const TAG = 'invite/saga'
export const TEMP_PW = 'ce10'
export const REDEEM_INVITE_TIMEOUT = 1 * 60 * 1000 // 1 minute
const INVITE_FEE = '0.2'

export async function getInviteTxGas(
  account: string,
  contractGetter: typeof getStableTokenContract | typeof getGoldTokenContract,
  amount: string,
  comment: string
) {
  const escrowContract = await getEscrowContract(web3)
  return getSendTxGas(account, contractGetter, {
    amount,
    comment,
    recipientAddress: escrowContract._address,
  })
}

export async function getInviteFee(
  account: string,
  contractGetter: typeof getStableTokenContract | typeof getGoldTokenContract,
  amount: string,
  comment: string
) {
  const gas = await getInviteTxGas(account, contractGetter, amount, comment)
  return (await calculateFee(gas)).plus(getInvitationVerificationFeeInWei())
}

export function getInvitationVerificationFeeInDollars() {
  return new BigNumber(INVITE_FEE)
}

export function getInvitationVerificationFeeInWei() {
  return new BigNumber(web3.utils.toWei(INVITE_FEE))
}

export async function generateLink(inviteCode: string, recipientName: string) {
  const packageName = VersionCheck.getPackageName().replace(/\.debug$/g, '.integration')
  const playStoreLink = await VersionCheck.getPlayStoreUrl({ packageName })
  const referrerData = encodeURIComponent(`invite-code=${inviteCode}`)
  const referrerLink = `${playStoreLink}&referrer=${referrerData}`
  const shortUrl = await dynamicLink(referrerLink)
  const msg = i18n.t('sendFlow7:inviteSMS', {
    name: recipientName,
    code: inviteCode,
    link: shortUrl,
  })

  return msg
}

async function sendSms(toPhone: string, msg: string) {
  return new Promise((resolve, reject) => {
    try {
      if (Platform.OS === 'android') {
        SendIntentAndroid.sendSms(toPhone, msg)
      } else {
        // TODO
        throw new Error('Implement sendSms using MFMessageComposeViewController on iOS')
      }
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

export function* sendInvite(
  recipientName: string,
  e164Number: string,
  inviteMode: InviteBy,
  amount?: BigNumber,
  currency?: CURRENCY_ENUM
) {
  yield call(getConnectedUnlockedAccount)
  try {
    const temporaryWalletAccount = web3.eth.accounts.create()
    const temporaryAddress = temporaryWalletAccount.address
    const inviteCode = createInviteCode(temporaryWalletAccount.privateKey)

    // TODO: Improve this by not checking specifically for this
    // display name. Requires improvements in recipient handling
    recipientName = recipientName === i18n.t('sendFlow7:mobileNumber') ? '' : ' ' + recipientName
    const msg = yield call(generateLink, inviteCode, recipientName)

    // Store the Temp Address locally so we know which transactions were invites
    yield put(storeInviteeData(temporaryAddress.toLowerCase(), e164Number))

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
    Logger.debug(TAG + '@sendInviteSaga', 'sent money to new wallet')

    // If this invitation has a payment attached to it, send the payment to the escrow.
    if (currency === CURRENCY_ENUM.DOLLAR && amount) {
      try {
        const phoneHash = getPhoneHash(e164Number)
        yield put(transferEscrowedPayment(phoneHash, amount, temporaryAddress))
      } catch (e) {
        Logger.error(TAG, 'Error sending payment to unverified user: ', e)
        yield put(showError(ErrorMessages.TRANSACTION_FAILED))
      }
    }

    switch (inviteMode) {
      case InviteBy.SMS: {
        yield call(sendSms, e164Number, msg)
        break
      }
      case InviteBy.WhatsApp: {
        yield Linking.openURL(`https://wa.me/${e164Number}?text=${encodeURIComponent(msg)}`)
        break
      }
    }

    // Wait a little bit so it has time to switch to Sms/WhatsApp before updating the UI
    yield delay(100)
  } catch (e) {
    Logger.error(TAG, 'Send invite error: ', e)
    throw e
  }
}

export function* sendInviteSaga(action: SendInviteAction) {
  const { e164Number, recipientName, inviteMode, amount, currency } = action

  try {
    yield call(sendInvite, recipientName, e164Number, inviteMode, amount, currency)

    yield put(showMessage(i18n.t('inviteSent', { ns: 'inviteFlow11' }) + ' ' + e164Number))
    yield call(navigate, Screens.WalletHome)
    yield put(sendInviteSuccess())
  } catch (e) {
    yield put(showError(ErrorMessages.INVITE_FAILED))
    yield put(sendInviteFailure(ErrorMessages.INVITE_FAILED))
  }
}

export function* redeemInviteSaga({ inviteCode }: RedeemInviteAction) {
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
  Logger.debug(TAG, 'Done Redeem invite')
}

export function* doRedeemInvite(inviteCode: string) {
  yield call(waitWeb3LastBlock)
  try {
    const tempAccount = web3.eth.accounts.privateKeyToAccount(inviteCode).address
    Logger.debug(`TAG@doRedeemInvite`, 'Invite code contains temp account', tempAccount)

    const tempAccountBalanceWei: BigNumber = yield call(getAccountBalance, tempAccount)
    if (tempAccountBalanceWei.isLessThanOrEqualTo(0)) {
      yield put(showError(ErrorMessages.EMPTY_INVITE_CODE))
      return false
    }

    const newAccount = yield call(getOrCreateAccount)
    if (!newAccount) {
      throw Error('Unable to create your account')
    }

    yield call(addTempAccountToWallet, inviteCode)
    yield call(withdrawFundsFromTempAccount, tempAccount, tempAccountBalanceWei, newAccount)
    yield put(fetchDollarBalance())
    return true
  } catch (e) {
    Logger.error(TAG, 'Failed to redeem invite', e)
    yield put(showError(ErrorMessages.REDEEM_INVITE_FAILED))
    return false
  }
}

async function addTempAccountToWallet(inviteCode: string) {
  Logger.debug(TAG + '@addTempAccountToWallet', 'Attempting to add temp wallet')
  try {
    // @ts-ignore
    const tempAccount = await web3.eth.personal.importRawKey(stripHexLeader(inviteCode), TEMP_PW)
    Logger.debug(TAG + '@addTempAccountToWallet', 'Account added', tempAccount)
  } catch (e) {
    if (e.toString().includes('account already exists')) {
      Logger.warn(TAG + '@addTempAccountToWallet', 'Account already exists, using it')
      return
    }
    Logger.error(TAG + '@addTempAccountToWallet', 'Failed to add account', e)
    throw new Error('Failed to add temp account to wallet')
  }
}

async function getAccountBalance(account: string) {
  Logger.debug(TAG + '@getAccountBalance', 'Checking account balance', account)
  const StableToken = await getStableTokenContract(web3)
  // Retry needed here because it's typically the app's first tx and seems to fail on occasion
  const stableBalance = await retryAsync(StableToken.methods.balanceOf(account).call, 3, [])
  Logger.debug(TAG + '@getAccountBalance', 'Account balance', stableBalance)
  return new BigNumber(stableBalance)
}

export async function withdrawFundsFromTempAccount(
  tempAccount: string,
  tempAccountBalanceWei: BigNumber,
  newAccount: string
) {
  Logger.debug(TAG + '@withdrawFundsFromTempAccount', 'Unlocking temporary account')
  await web3.eth.personal.unlockAccount(tempAccount, TEMP_PW, 600)

  const tempAccountBalance = new BigNumber(web3.utils.fromWei(tempAccountBalanceWei.toString()))

  Logger.debug(TAG + '@withdrawFundsFromTempAccount', 'Creating send transaction')
  const tx = await createTransaction(getStableTokenContract, {
    recipientAddress: newAccount,
    comment: SENTINEL_INVITE_COMMENT,
    // TODO: appropriately withdraw the balance instead of using gas fees will be less than 1 cent
    amount: tempAccountBalance.minus(0.01).toString(),
  })

  Logger.debug(TAG + '@withdrawFundsFromTempAccount', 'Sending transaction')
  await sendTransaction(tx, tempAccount, TAG, 'Transfer from temp wallet')
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
}
