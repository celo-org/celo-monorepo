import { getEscrowContract, getStableTokenContract } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { all, call, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ERROR_BANNER_DURATION } from 'src/config'
import {
  Actions,
  EscrowedPayment,
  EXPIRY_SECONDS,
  ReclaimPaymentAction,
  reclaimPaymentFailure,
  reclaimPaymentSuccess,
  storeSentPayments,
  TransferPaymentAction,
} from 'src/escrow/actions'
import { SHORT_CURRENCIES } from 'src/geth/consts'
import i18n from 'src/i18n'
import { Actions as IdentityActions, EndVerificationAction } from 'src/identity/actions'
import { NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import { inviteesSelector } from 'src/invite/reducer'
import { TEMP_PW } from 'src/invite/saga'
import { isValidPrivateKey } from 'src/invite/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { recipientCacheSelector } from 'src/send/reducers'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { generateStandbyTransactionId } from 'src/transactions/actions'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { fetchGasPrice } from 'src/web3/gas'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'escrow/saga'

function* transferStableTokenToEscrow(action: TransferPaymentAction) {
  try {
    const { phoneHash, amount, txId, tempWalletAddress } = action
    const escrow = yield call(getEscrowContract, web3)
    const stableToken = yield call(getStableTokenContract, web3)

    const account = yield call(getConnectedUnlockedAccount)

    Logger.debug(TAG + '@transferToEscrow', 'Approving escrow transfer')
    const convertedAmount = web3.utils.toWei(amount.toString())
    const approvalTx = stableToken.methods.approve(escrow.options.address, convertedAmount)

    yield call(sendTransaction, approvalTx, account, TAG, txId)

    Logger.debug(TAG + '@transferToEscrow', 'Transfering to escrow')

    const transferTx = escrow.methods.transfer(
      phoneHash,
      stableToken.options.address,
      convertedAmount.toString(),
      EXPIRY_SECONDS,
      tempWalletAddress,
      NUM_ATTESTATIONS_REQUIRED
    )

    yield call(sendAndMonitorTransaction, txId, transferTx, account)
    yield call(getSentPayments)
  } catch (e) {
    Logger.error(TAG + '@transferToEscrow', 'Error transfering to escrow', e)
    if (e.message === ErrorMessages.INCORRECT_PIN) {
      yield put(showError(ErrorMessages.INCORRECT_PIN, ERROR_BANNER_DURATION))
    }
    throw e
  }
}

function* withdrawFromEscrow(action: EndVerificationAction) {
  if (!action.success) {
    Logger.debug(
      TAG + '@withdrawFromEscrow',
      'Skipping escrow withdrawal because verification failed'
    )
    return
  }

  try {
    const escrow = yield call(getEscrowContract, web3)
    const account = yield call(getConnectedUnlockedAccount)
    const inviteCode: string = yield select((state: RootState) => state.invite.redeemedInviteCode)

    Logger.debug(TAG + '@withdrawFromEscrow', 'Withdrawing escrowed payment')
    if (!isValidPrivateKey(inviteCode)) {
      Logger.warn(TAG + '@withdrawFromEscrow', 'Invalid private key, skipping escrow withdrawal')
      return
    }

    const tempWalletAddress = web3.eth.accounts.privateKeyToAccount(inviteCode).address
    Logger.debug(TAG + '@withdrawFromEscrow', 'Added temp account to wallet: ' + tempWalletAddress)

    // Check if there is a payment associated with this invite code
    const receivedPayment = yield call(getEscrowedPayment, tempWalletAddress)
    const value = new BigNumber(receivedPayment[3])

    if (value.toNumber() > 0) {
      // Unlock temporary account
      yield call(web3.eth.personal.unlockAccount, tempWalletAddress, TEMP_PW, 600)

      const msgHash = web3.utils.soliditySha3({ type: 'address', value: account })

      // using the temporary wallet account to sign a message. The message is the current account.
      let signature = yield web3.eth.sign(msgHash, tempWalletAddress)
      signature = signature.slice(2)
      const r = `0x${signature.slice(0, 64)}`
      const s = `0x${signature.slice(64, 128)}`
      const v = web3.utils.hexToNumber(signature.slice(128, 130))

      const withdrawTx = escrow.methods.withdraw(tempWalletAddress, v, r, s)
      const txID = generateStandbyTransactionId(account)

      yield call(sendTransaction, withdrawTx, account, TAG, txID)

      yield call(fetchDollarBalance)
      yield call(getSentPayments)
      Logger.showMessage(i18n.t('inviteFlow11:transferDollarsToAccount'))
    }
  } catch (e) {
    Logger.error(TAG + '@withdrawFromEscrow', 'Error withdrawing payment from escrow', e)
    if (e.message === ErrorMessages.INCORRECT_PIN) {
      yield put(showError(ErrorMessages.INCORRECT_PIN, ERROR_BANNER_DURATION))
    }
    throw e
  }
}

async function createReclaimTransaction(paymentID: string) {
  const escrow = await getEscrowContract(web3)
  return escrow.methods.revoke(paymentID)
}

export async function getReclaimEscrowFee(account: string, paymentID: string) {
  // create mock transaction and get gas
  const tx = await createReclaimTransaction(paymentID)
  const txParams = {
    from: account,
    gasCurrency: (await getStableTokenContract(web3))._address,
  }
  const gas = new BigNumber(await tx.estimateGas(txParams))
  const gasPrice = new BigNumber(await fetchGasPrice())
  Logger.debug(`${TAG}/getReclaimEscrowFee`, `estimated gas: ${gas}`)
  Logger.debug(`${TAG}/getReclaimEscrowFee`, `gas price: ${gasPrice}`)
  const feeInWei = gas.multipliedBy(gasPrice)
  Logger.debug(`${TAG}/getReclaimEscrowFee`, `New fee is: ${feeInWei}`)
  return feeInWei
}

function* reclaimFromEscrow(action: ReclaimPaymentAction) {
  try {
    const { paymentID } = action
    const account = yield call(getConnectedUnlockedAccount)

    Logger.debug(TAG + '@reclaimFromEscrow', 'Reclaiming escrowed payment')
    const reclaimTx = yield call(createReclaimTransaction, paymentID)
    const txID = generateStandbyTransactionId(account)
    yield call(sendTransaction, reclaimTx, account, TAG, txID)

    yield call(fetchDollarBalance)
    yield call(getSentPayments)

    yield call(navigate, Screens.WalletHome)
    yield put(reclaimPaymentSuccess())
  } catch (e) {
    Logger.error(TAG + '@reclaimFromEscrow', 'Error reclaiming payment from escrow', e)
    if (e.message === ErrorMessages.INCORRECT_PIN) {
      yield put(showError(ErrorMessages.INCORRECT_PIN, ERROR_BANNER_DURATION))
    } else {
      yield put(showError(ErrorMessages.RECLAIMING_ESCROWED_PAYMENT_FAILED, ERROR_BANNER_DURATION))
    }
    yield put(reclaimPaymentFailure(e))
    throw e
  }
}

function* getEscrowedPayment(paymentID: string) {
  try {
    const escrow = yield call(getEscrowContract, web3)

    Logger.debug(TAG + '@getEscrowedPayment', 'Fetching escrowed payment')
    const payment = yield escrow.methods.escrowedPayments(paymentID).call()
    return payment
  } catch (e) {
    Logger.error(TAG + '@getEscrowedPayment', 'Error fetching escrowed payment', e)
    throw e
  }
}

function* getSentPayments() {
  try {
    const escrow = yield call(getEscrowContract, web3)
    const account = yield call(getConnectedAccount)
    const recipientsPhoneNumbers = yield select(inviteesSelector)
    const recipientPhoneNumberToContact = yield select(recipientCacheSelector)

    Logger.debug(TAG + '@getSentPayments', 'Fetching valid sent escrowed payments')
    const sentPaymentIDs: string[] = yield escrow.methods.getSentPaymentIds(account).call()
    const sentPayments = yield all(
      sentPaymentIDs.map((paymentID) => call(getEscrowedPayment, paymentID))
    )

    const sentPaymentsNotifications: EscrowedPayment[] = []
    for (let i = 0; i < sentPayments.length; i++) {
      const payment = sentPayments[i]
      const recipientPhoneNumber = recipientsPhoneNumbers[sentPaymentIDs[i].toLowerCase()]
      const transformedPayment: EscrowedPayment = {
        senderAddress: payment[1],
        recipientPhone: recipientPhoneNumber,
        recipientContact: recipientPhoneNumberToContact[recipientPhoneNumber] || undefined,
        paymentID: sentPaymentIDs[i],
        currency: SHORT_CURRENCIES.DOLLAR, // Only dollars can be escrowed
        amount: payment[3],
        timestamp: payment[6],
        expirySeconds: payment[7],
      }
      sentPaymentsNotifications.push(transformedPayment)
    }
    yield put(storeSentPayments(sentPaymentsNotifications))
  } catch (e) {
    Logger.error(TAG + '@getSentPayments', 'Error fetching sent escrowed payments', e)
    throw e
  }
}

export function* watchTransferPayment() {
  yield takeLeading(Actions.TRANSFER_PAYMENT, transferStableTokenToEscrow)
}

export function* watchReclaimPayment() {
  yield takeLeading(Actions.RECLAIM_PAYMENT, reclaimFromEscrow)
}

export function* watchGetSentPayments() {
  yield takeLeading(Actions.GET_SENT_PAYMENTS, getSentPayments)
}

export function* watchVerificationEnd() {
  yield takeLeading(IdentityActions.END_VERIFICATION, withdrawFromEscrow)
}

export function* escrowSaga() {
  yield spawn(watchTransferPayment)
  yield spawn(watchReclaimPayment)
  yield spawn(watchGetSentPayments)
  yield spawn(watchVerificationEnd)
}
