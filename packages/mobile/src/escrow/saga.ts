import { getEscrowContract, getStableTokenContract } from '@celo/walletkit'
import { Escrow } from '@celo/walletkit/lib/types/Escrow'
import { StableToken } from '@celo/walletkit/types/StableToken'
import BigNumber from 'bignumber.js'
import { all, call, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ESCROW_PAYMENT_EXPIRY_SECONDS } from 'src/config'
import {
  Actions,
  EscrowedPayment,
  EscrowReclaimPaymentAction,
  EscrowTransferPaymentAction,
  fetchSentEscrowPayments,
  reclaimEscrowPaymentFailure,
  reclaimEscrowPaymentSuccess,
  storeSentEscrowPayments,
} from 'src/escrow/actions'
import { calculateFee } from 'src/fees/saga'
import { CURRENCY_ENUM, SHORT_CURRENCIES } from 'src/geth/consts'
import i18n from 'src/i18n'
import { Actions as IdentityActions, EndVerificationAction } from 'src/identity/actions'
import { NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import { Invitees } from 'src/invite/actions'
import { inviteesSelector } from 'src/invite/reducer'
import { TEMP_PW } from 'src/invite/saga'
import { isValidPrivateKey } from 'src/invite/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { addStandbyTransaction, generateStandbyTransactionId } from 'src/transactions/actions'
import { TransactionStatus, TransactionTypes } from 'src/transactions/reducer'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import Logger from 'src/utils/Logger'
import { addLocalAccount, isZeroSyncMode, web3 } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'escrow/saga'

function* transferStableTokenToEscrow(action: EscrowTransferPaymentAction) {
  Logger.debug(TAG + '@transferToEscrow', 'Begin transfer to escrow')
  try {
    const { phoneHash, amount, tempWalletAddress } = action
    const escrow: Escrow = yield call(getEscrowContract, web3)
    const stableToken: StableToken = yield call(getStableTokenContract, web3)
    const account: string = yield call(getConnectedUnlockedAccount)

    Logger.debug(TAG + '@transferToEscrow', 'Approving escrow transfer')
    const convertedAmount = web3.utils.toWei(amount.toString())
    const approvalTx = stableToken.methods.approve(escrow.options.address, convertedAmount)

    yield call(sendTransaction, approvalTx, account, TAG, 'approval')

    Logger.debug(TAG + '@transferToEscrow', 'Transfering to escrow')

    const transferTxId = generateStandbyTransactionId(escrow._address)
    yield call(registerStandbyTransaction, transferTxId, amount.toString(), escrow._address)

    const transferTx = escrow.methods.transfer(
      phoneHash,
      stableToken.options.address,
      convertedAmount,
      ESCROW_PAYMENT_EXPIRY_SECONDS,
      tempWalletAddress,
      NUM_ATTESTATIONS_REQUIRED
    )

    yield call(sendAndMonitorTransaction, transferTxId, transferTx, account)
    yield put(fetchSentEscrowPayments())
  } catch (e) {
    Logger.error(TAG + '@transferToEscrow', 'Error transfering to escrow', e)
    if (e.message === ErrorMessages.INCORRECT_PIN) {
      yield put(showError(ErrorMessages.INCORRECT_PIN))
    } else {
      yield put(showError(ErrorMessages.ESCROW_TRANSFER_FAILED))
    }
  }
}

function* registerStandbyTransaction(id: string, value: string, address: string) {
  yield put(
    addStandbyTransaction({
      id,
      type: TransactionTypes.SENT,
      status: TransactionStatus.Pending,
      value,
      symbol: CURRENCY_ENUM.DOLLAR,
      timestamp: Math.floor(Date.now() / 1000),
      address,
      comment: '',
    })
  )
}

function* withdrawFromEscrow(action: EndVerificationAction) {
  if (!action.success) {
    Logger.debug(TAG + '@withdrawFromEscrow', 'Skipping withdrawal because verification failed')
    return
  }

  try {
    Logger.debug(TAG + '@withdrawFromEscrow', 'Withdrawing escrowed payment')

    const escrow: Escrow = yield call(getEscrowContract, web3)
    const account: string = yield call(getConnectedUnlockedAccount)
    const tmpWalletPrivateKey: string = yield select(
      (state: RootState) => state.invite.redeemedInviteCode
    )

    if (!isValidPrivateKey(tmpWalletPrivateKey)) {
      Logger.warn(TAG + '@withdrawFromEscrow', 'Invalid private key, skipping escrow withdrawal')
      return
    }

    const tempWalletAddress = web3.eth.accounts.privateKeyToAccount(tmpWalletPrivateKey).address
    if (isZeroSyncMode()) {
      addLocalAccount(web3, tmpWalletPrivateKey)
    }
    Logger.debug(TAG + '@withdrawFromEscrow', 'Added temp account to wallet: ' + tempWalletAddress)

    // Check if there is a payment associated with this invite code
    const receivedPayment = yield call(getEscrowedPayment, escrow, tempWalletAddress)
    const value = new BigNumber(receivedPayment[3])
    if (!value.isGreaterThan(0)) {
      Logger.warn(TAG + '@withdrawFromEscrow', 'Escrow payment is empty, skpping.')
      return
    }

    if (isZeroSyncMode()) {
      Logger.info(
        TAG + '@withdrawFromEscrow',
        'Geth free mode is on, no need to unlock the temporary account'
      )
    } else {
      // Unlock temporary account
      yield call(web3.eth.personal.unlockAccount, tempWalletAddress, TEMP_PW, 600)
    }

    const msgHash = web3.utils.soliditySha3({ type: 'address', value: account })

    Logger.debug(TAG + '@withdrawFromEscrow', `Signing message hash ${msgHash}`)
    // using the temporary wallet account to sign a message. The message is the current account.
    let signature: string = (yield web3.eth.accounts.sign(msgHash, tmpWalletPrivateKey)).signature
    Logger.debug(TAG + '@withdrawFromEscrow', `Signed message hash signature is ${signature}`)
    signature = signature.slice(2)
    const r = `0x${signature.slice(0, 64)}`
    const s = `0x${signature.slice(64, 128)}`
    const v = web3.utils.hexToNumber(signature.slice(128, 130))

    const withdrawTx = escrow.methods.withdraw(tempWalletAddress, v, r, s)
    const txID = generateStandbyTransactionId(account)

    yield call(sendTransaction, withdrawTx, account, TAG, txID)

    yield put(fetchDollarBalance())
    Logger.showMessage(i18n.t('inviteFlow11:transferDollarsToAccount'))
  } catch (e) {
    Logger.error(TAG + '@withdrawFromEscrow', 'Error withdrawing payment from escrow', e)
    if (e.message === ErrorMessages.INCORRECT_PIN) {
      yield put(showError(ErrorMessages.INCORRECT_PIN))
    } else {
      yield put(showError(ErrorMessages.ESCROW_WITHDRAWAL_FAILED))
    }
  }
}

async function createReclaimTransaction(paymentID: string) {
  const escrow = await getEscrowContract(web3)
  return escrow.methods.revoke(paymentID)
}

export async function getReclaimEscrowGas(account: string, paymentID: string) {
  Logger.debug(`${TAG}/getReclaimEscrowGas`, 'Getting gas estimate for escrow reclaim tx')
  const tx = await createReclaimTransaction(paymentID)
  const txParams = {
    from: account,
    gasCurrency: (await getStableTokenContract(web3))._address,
  }
  const gas = new BigNumber(await tx.estimateGas(txParams))
  Logger.debug(`${TAG}/getReclaimEscrowGas`, `Estimated gas of ${gas.toString()}}`)
  return gas
}

export async function getReclaimEscrowFee(account: string, paymentID: string) {
  const gas = await getReclaimEscrowGas(account, paymentID)
  return calculateFee(gas)
}

function* reclaimFromEscrow({ paymentID }: EscrowReclaimPaymentAction) {
  Logger.debug(TAG + '@reclaimFromEscrow', 'Reclaiming escrowed payment')

  try {
    const account = yield call(getConnectedUnlockedAccount)

    const reclaimTx = yield call(createReclaimTransaction, paymentID)
    yield call(sendTransaction, reclaimTx, account, TAG, 'escrow reclaim')

    yield put(fetchDollarBalance())
    yield put(fetchSentEscrowPayments())

    yield call(navigate, Screens.WalletHome)
    yield put(reclaimEscrowPaymentSuccess())
  } catch (e) {
    Logger.error(TAG + '@reclaimFromEscrow', 'Error reclaiming payment from escrow', e)
    if (e.message === ErrorMessages.INCORRECT_PIN) {
      yield put(showError(ErrorMessages.INCORRECT_PIN))
    } else {
      yield put(showError(ErrorMessages.RECLAIMING_ESCROWED_PAYMENT_FAILED))
    }
    yield put(reclaimEscrowPaymentFailure(e))
    yield put(fetchSentEscrowPayments())
  }
}

async function getEscrowedPayment(escrow: Escrow, paymentID: string) {
  Logger.debug(TAG + '@getEscrowedPayment', 'Fetching escrowed payment')

  try {
    const payment = await escrow.methods.escrowedPayments(paymentID).call()
    return payment
  } catch (e) {
    Logger.error(TAG + '@getEscrowedPayment', 'Error fetching escrowed payment', e)
    throw e
  }
}

function* doFetchSentPayments() {
  Logger.debug(TAG + '@doFetchSentPayments', 'Fetching valid sent escrowed payments')

  try {
    const escrow: Escrow = yield call(getEscrowContract, web3)
    const account: string = yield call(getConnectedAccount)

    const sentPaymentIDs: string[] = yield call(escrow.methods.getSentPaymentIds(account).call) // Note: payment ids are currently temp wallet addresses
    if (!sentPaymentIDs || !sentPaymentIDs.length) {
      Logger.debug(TAG + '@doFetchSentPayments', 'No payments ids found, clearing stored payments')
      yield put(storeSentEscrowPayments([]))
      return
    }
    Logger.debug(
      TAG + '@doFetchSentPayments',
      `Fetching data for ${sentPaymentIDs.length} payments`
    )
    const sentPaymentsRaw = yield all(
      sentPaymentIDs.map((paymentID) => call(getEscrowedPayment, escrow, paymentID))
    )

    const tempAddresstoRecipientPhoneNumber: Invitees = yield select(inviteesSelector)
    const sentPayments: EscrowedPayment[] = []
    for (let i = 0; i < sentPaymentsRaw.length; i++) {
      const id = sentPaymentIDs[i].toLowerCase()
      const recipientPhoneNumber = tempAddresstoRecipientPhoneNumber[id]

      const payment = sentPaymentsRaw[i]
      if (!payment) {
        continue
      }

      const escrowPaymentWithRecipient: EscrowedPayment = {
        paymentID: id,
        senderAddress: payment[1],
        recipientPhone: recipientPhoneNumber,
        currency: SHORT_CURRENCIES.DOLLAR, // Only dollars can be escrowed
        amount: payment[3],
        timestamp: payment[6],
        expirySeconds: payment[7],
      }
      sentPayments.push(escrowPaymentWithRecipient)
    }

    yield put(storeSentEscrowPayments(sentPayments))
  } catch (e) {
    Logger.error(TAG + '@doFetchSentPayments', 'Error fetching sent escrowed payments', e)
  }
}

export function getReclaimableEscrowPayments(allPayments: EscrowedPayment[]) {
  const currUnixTime = Date.now() / 1000
  return allPayments.filter((payment) => {
    const paymentExpiryTime = +payment.timestamp + +payment.expirySeconds
    return currUnixTime >= paymentExpiryTime
  })
}

export function* watchTransferPayment() {
  yield takeLeading(Actions.TRANSFER_PAYMENT, transferStableTokenToEscrow)
}

export function* watchReclaimPayment() {
  yield takeLeading(Actions.RECLAIM_PAYMENT, reclaimFromEscrow)
}

export function* watchFetchSentPayments() {
  yield takeLeading(Actions.FETCH_SENT_PAYMENTS, doFetchSentPayments)
}

export function* watchVerificationEnd() {
  yield takeLeading(IdentityActions.END_VERIFICATION, withdrawFromEscrow)
}

export function* escrowSaga() {
  yield spawn(watchTransferPayment)
  yield spawn(watchReclaimPayment)
  yield spawn(watchFetchSentPayments)
  yield spawn(watchVerificationEnd)
}
