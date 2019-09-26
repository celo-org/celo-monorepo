import { retryAsync } from '@celo/utils/src/async'
import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import { stripHexLeader } from '@celo/utils/src/signatureUtils'
import {
  getEscrowContract,
  getGoldTokenContract,
  getStableTokenContract,
  parseFromContractDecimals,
} from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import { Linking, Platform } from 'react-native'
import SendIntentAndroid from 'react-native-send-intent'
import VersionCheck from 'react-native-version-check'
import { call, delay, put, race, select, spawn, takeLeading } from 'redux-saga/effects'
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
import { transferStableToken } from 'src/stableToken/actions'
import { createTransaction } from 'src/tokens/saga'
import { generateStandbyTransactionId } from 'src/transactions/actions'
import { waitForTransactionWithId } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import { dynamicLink } from 'src/utils/dynamicLink'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { getConnectedUnlockedAccount, getOrCreateAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

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

function* redeemSuccess(account: string) {
  Logger.showMessage(i18n.t('inviteFlow11:redeemSuccess'))
  web3.eth.defaultAccount = account
  yield put(redeemInviteSuccess())
}

export function* redeemInviteSaga({ inviteCode }: RedeemInviteAction) {
  Logger.debug(TAG, 'Starting Redeem Invite')

  const { result, timeout } = yield race({
    result: call(doRedeemInvite, inviteCode),
    timeout: delay(REDEEM_INVITE_TIMEOUT),
  })

  if (result === true) {
    Logger.debug(TAG, 'Redeem Invite completed successfully')
    CeloAnalytics.track(CustomEventNames.redeem_invite_success)
  } else if (result === false) {
    Logger.debug(TAG, 'Redeem Invite failed')
    CeloAnalytics.track(CustomEventNames.redeem_invite_failed)
    yield put(showError(ErrorMessages.REDEEM_INVITE_FAILED))
  } else if (timeout) {
    Logger.debug(TAG, 'Redeem Invite timed out')
    CeloAnalytics.track(CustomEventNames.redeem_invite_timed_out)
    yield put(showError(ErrorMessages.REDEEM_INVITE_TIMEOUT))
  }
  Logger.debug(TAG, 'Done Redeem invite')
}

export function* doRedeemInvite(inviteCode: string) {
  yield call(waitWeb3LastBlock)
  try {
    // Check that the balance of the new account is not 0
    const StableToken = yield call(getStableTokenContract, web3)
    const stableBalance = new BigNumber(
      yield call(retryAsync, StableToken.methods.balanceOf(tempAccount).call, 2, [])
    )

    Logger.debug(TAG + '@redeemInviteCode', 'Temporary account balance: ' + stableBalance)

    yield call(addTempAccountToWallet, inviteCode)

    if (stableBalance.isLessThan(1)) {
      // check if new user account has already been created
      const account = yield select(currentAccountSelector)
      if (account) {
        // check if balance from the temp account has already been redeemed
        const accountBalance = new BigNumber(
          yield call(StableToken.methods.balanceOf(account).call)
        )
        Logger.debug(TAG + '@redeemInviteCode', 'Existing account balance: ' + accountBalance)
        if (accountBalance.isGreaterThan(0)) {
          yield redeemSuccess(account)
          return
        }
      }

      throw Error('Expired or incorrect invite code')
    }

    // Create new local account
    Logger.debug(TAG + '@redeemInviteCode', 'Creating new account')
    const newAccount = yield call(getOrCreateAccount)
    if (!newAccount) {
      throw Error('Unable to create your account')
    }

    Logger.debug(TAG + '@redeemInviteCode', 'Trying to transfer to new account ' + newAccount)
    // Unlock temporary account
    yield call(web3.eth.personal.unlockAccount, tempAccount, TEMP_PW, 600)

    // TODO(cmcewen): calculate the proper amount when gas estimation is working
    const stableBalanceConverted = yield parseFromContractDecimals(stableBalance, StableToken)

    const tx = yield call(createTransaction, getStableTokenContract, {
      recipientAddress: newAccount,
      comment: SENTINEL_INVITE_COMMENT,
      // TODO: appropriately withdraw the balance instead of using gas fees will be less than 1 cent
      amount: stableBalanceConverted.minus('0.01').toString(),
    })

    yield call(sendTransaction, tx, tempAccount, TAG, 'Transfer from temp wallet')

    // Make sure we got the money
    const newAccountBalance = new BigNumber(
      yield call(StableToken.methods.balanceOf(newAccount).call)
    )
    Logger.debug(TAG + '@redeemInviteCode', 'New account balance: ' + newAccountBalance)
    if (newAccountBalance.isLessThan(1)) {
      throw Error('Transfer to new local account was not successful')
    }
    yield redeemSuccess(newAccount)
    return true
  } catch (e) {
    Logger.error(TAG, 'Redeem invite error: ', e)
    return false
  }
}

async function addTempAccountToWallet(inviteCode: string) {
  Logger.debug(TAG + '@addTempAccountToWallet', 'Attempting to add temp wallet')
  // Add temp wallet so we can send money from it
  try {
    // @ts-ignore
    const tempAccount = await web3.eth.personal.importRawKey(stripHexLeader(inviteCode), TEMP_PW)
    Logger.debug(TAG + '@addTempAccountToWallet', 'Account added', tempAccount)
    return tempAccount
  } catch (e) {
    if (e.toString().includes('account already exists')) {
      Logger.warn(TAG + '@addTempAccountToWallet', 'Account already exists, using it')
      return web3.eth.accounts.privateKeyToAccount(inviteCode).address
    }

    Logger.error(TAG + '@addTempAccountToWallet', 'Failed to add account', e)
    throw new Error('Failed to add temp account to wallet')
  }
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
