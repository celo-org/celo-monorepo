import {
  getAttestationFee,
  getAttestationsContract,
  getStableTokenContract,
} from '@celo/contractkit'
import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import BigNumber from 'bignumber.js'
import { Linking } from 'react-native'
import SmsAndroid from 'react-native-sms-android'
import VersionCheck from 'react-native-version-check'
import { call, delay, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { setName } from 'src/account'
import { showError, showMessage } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ERROR_BANNER_DURATION } from 'src/config'
import { transferEscrowedPayment } from 'src/escrow/actions'
import { CURRENCY_ENUM, INVITE_REDEMPTION_GAS } from 'src/geth/consts'
import { waitForGethConnectivity } from 'src/geth/saga'
import i18n from 'src/i18n'
import { NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import {
  Actions,
  InviteBy,
  redeemComplete,
  RedeemInviteAction,
  SendInviteAction,
  sendInviteFailure,
  sendInviteSuccess,
  SENTINEL_INVITE_COMMENT,
  storeInviteeData,
} from 'src/invite/actions'
import { createInviteCode } from 'src/invite/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { transferStableToken } from 'src/stableToken/actions'
import { createTransaction } from 'src/tokens/saga'
import { generateStandbyTransactionId } from 'src/transactions/actions'
import { waitForTransactionWithId } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import { dynamicLink } from 'src/utils/dynamicLink'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { fetchGasPrice } from 'src/web3/gas'
import { createNewAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'invite/saga'
export const TEMP_PW = 'ce10'

const USE_REAL_FEE = false
const INVITE_FEE = '0.2'
const INVITE_SEND_AMOUNT = '0.18'

// TODO(Rossy) Cache this so we don't recalculate it every time we invite someone
// Especially relevant when inviting many friends
export async function getInvitationVerificationFee() {
  // TODO(cmcewen): don't use this
  if (!USE_REAL_FEE) {
    return web3.utils.toWei(INVITE_FEE)
  }
  const attestationsContract = await getAttestationsContract(web3)
  const stableTokenContract = await getStableTokenContract(web3)
  const verificationFee = await getAttestationFee(
    attestationsContract,
    stableTokenContract,
    NUM_ATTESTATIONS_REQUIRED
  )

  const gasPrice = await fetchGasPrice()
  // TODO: estimate gas properly
  const gasFee = new BigNumber(INVITE_REDEMPTION_GAS).times(gasPrice)

  // We multiply by two to provide a buffer in the event that some requests fail.
  return verificationFee
    .times(NUM_ATTESTATIONS_REQUIRED)
    .plus(gasFee)
    .times(2)
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
    SmsAndroid.sms(toPhone, msg, 'sendIndirect', (err: Error) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
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
        yield put(transferEscrowedPayment(phoneHash, amount, txId, temporaryAddress))
      } catch (e) {
        Logger.error(TAG, 'Error sending payment to unverified user: ', e)
        yield put(showError(ErrorMessages.TRANSACTION_FAILED, ERROR_BANNER_DURATION))
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

    yield put(
      showMessage(
        i18n.t('inviteSent', { ns: 'inviteFlow11' }) + ' ' + e164Number,
        ERROR_BANNER_DURATION
      )
    )
    yield call(navigate, Screens.WalletHome)
    yield put(sendInviteSuccess())
  } catch (e) {
    yield put(showError(ErrorMessages.INVITE_FAILED, ERROR_BANNER_DURATION))
    yield put(sendInviteFailure(ErrorMessages.INVITE_FAILED))
  }
}

function* redeemSuccess(name: string, account: string) {
  Logger.showMessage(i18n.t('inviteFlow11:redeemSuccess'))
  web3.eth.defaultAccount = account
  yield put(setName(name))
  yield put(redeemComplete(true))
}

export function* redeemInviteSaga(action: RedeemInviteAction) {
  const { inviteCode, name } = action

  yield call(waitForGethConnectivity)
  try {
    // Add temp wallet so we can send money from it
    let tempAccount
    try {
      // @ts-ignore
      tempAccount = yield call(web3.eth.personal.importRawKey, String(inviteCode).slice(2), TEMP_PW)
    } catch (e) {
      if (e.toString().includes('account already exists')) {
        tempAccount = web3.eth.accounts.privateKeyToAccount(inviteCode).address
      } else {
        throw e
      }
    }
    Logger.debug(TAG + '@redeemInviteCode', 'Added temp account to wallet: ' + tempAccount)

    // Check that the balance of the new account is not 0
    const StableToken = yield call(getStableTokenContract, web3)
    const stableBalance = new BigNumber(yield call(StableToken.methods.balanceOf(tempAccount).call))
    Logger.debug(TAG + '@redeemInviteCode', 'Temporary account balance: ' + stableBalance)

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
          yield redeemSuccess(name, account)
          return
        }
      }

      throw Error('Expired or incorrect invite code')
    }

    // Create new local account
    Logger.debug(TAG + '@redeemInviteCode', 'Creating new account')
    const newAccount = yield call(createNewAccount)
    if (!newAccount) {
      throw Error('Unable to create your account')
    }

    Logger.debug(TAG + '@redeemInviteCode', 'Trying to transfer to new account ' + newAccount)
    // Unlock temporary account
    yield call(web3.eth.personal.unlockAccount, tempAccount, TEMP_PW, 600)

    // TODO(cmcewen): calculate the proper amount when gas estimation is working

    const tx = yield call(createTransaction, getStableTokenContract, {
      recipientAddress: newAccount,
      comment: SENTINEL_INVITE_COMMENT,
      amount: INVITE_SEND_AMOUNT,
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
    yield redeemSuccess(name, newAccount)
  } catch (e) {
    Logger.error(TAG, 'Redeem invite error: ', e)
    yield put(showError(ErrorMessages.REDEEM_INVITE_FAILED, ERROR_BANNER_DURATION))
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
