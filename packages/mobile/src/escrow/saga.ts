import { ContractKit } from '@celo/contractkit'
import { EscrowWrapper } from '@celo/contractkit/lib/wrappers/Escrow'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { ensureLeading0x, privateKeyToAddress, trimLeading0x } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'
import { all, call, put, select, spawn, take, takeLeading } from 'redux-saga/effects'
import { showError, showErrorOrFallback } from 'src/alert/actions'
import { EscrowEvents, OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
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
import { waitForNextBlock } from 'src/geth/saga'
import i18n from 'src/i18n'
import { Actions as IdentityActions, SetVerificationStatusAction } from 'src/identity/actions'
import { addressToE164NumberSelector } from 'src/identity/reducer'
import { VerificationStatus } from 'src/identity/types'
import { NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import { isValidPrivateKey } from 'src/invite/utils'
import { navigateHome } from 'src/navigator/NavigationService'
import { RootState } from 'src/redux/reducers'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { getCurrencyAddress } from 'src/tokens/saga'
import { addStandbyTransaction } from 'src/transactions/actions'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import {
  newTransactionContext,
  TransactionContext,
  TransactionStatus,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { estimateGas } from 'src/web3/utils'

const TAG = 'escrow/saga'

function* transferStableTokenToEscrow(action: EscrowTransferPaymentAction) {
  Logger.debug(TAG + '@transferToEscrow', 'Begin transfer to escrow')
  try {
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_start)
    const { phoneHash, amount, tempWalletAddress, context } = action
    const account: string = yield call(getConnectedUnlockedAccount)

    const contractKit: ContractKit = yield call(getContractKit)

    const stableToken: StableTokenWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getStableToken,
    ])
    const escrow: EscrowWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getEscrow,
    ])

    // Approve a transfer of funds to the Escrow contract.
    Logger.debug(TAG + '@transferToEscrow', 'Approving escrow transfer')
    const convertedAmount = contractKit.web3.utils.toWei(amount.toString())
    const approvalTx = stableToken.approve(escrow.address, convertedAmount)

    yield call(
      sendTransaction,
      approvalTx.txo,
      account,
      newTransactionContext(TAG, 'Approve transfer to Escrow')
    )
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_approve_tx_sent)

    // Tranfser the funds to the Escrow contract.
    Logger.debug(TAG + '@transferToEscrow', 'Transfering to escrow')
    yield call(registerStandbyTransaction, context, amount.toString(), escrow.address)

    const transferTx = escrow.transfer(
      phoneHash,
      stableToken.address,
      convertedAmount,
      ESCROW_PAYMENT_EXPIRY_SECONDS,
      tempWalletAddress,
      NUM_ATTESTATIONS_REQUIRED
    )
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_transfer_tx_sent)
    yield call(sendAndMonitorTransaction, transferTx, account, context)
    yield put(fetchSentEscrowPayments())
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_complete)
  } catch (e) {
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_error, { error: e.message })
    Logger.error(TAG + '@transferToEscrow', 'Error transfering to escrow', e)
    yield put(showErrorOrFallback(e, ErrorMessages.ESCROW_TRANSFER_FAILED))
  }
}

function* registerStandbyTransaction(context: TransactionContext, value: string, address: string) {
  yield put(
    addStandbyTransaction({
      context,
      type: TokenTransactionType.EscrowSent,
      status: TransactionStatus.Pending,
      value,
      symbol: CURRENCY_ENUM.DOLLAR,
      timestamp: Math.floor(Date.now() / 1000),
      address,
      comment: '',
    })
  )
}

function* withdrawFromEscrow() {
  try {
    ValoraAnalytics.track(OnboardingEvents.escrow_redeem_start)
    Logger.debug(TAG + '@withdrawFromEscrow', 'Withdrawing escrowed payment')

    const contractKit = yield call(getContractKit)

    const escrow: EscrowWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getEscrow,
    ])
    const account: string = yield call(getConnectedUnlockedAccount)
    const tmpWalletPrivateKey: string | null = yield select(
      (state: RootState) => state.invite.redeemedTempAccountPrivateKey
    )

    if (!tmpWalletPrivateKey || !isValidPrivateKey(tmpWalletPrivateKey)) {
      Logger.warn(TAG + '@withdrawFromEscrow', 'Invalid private key, skipping escrow withdrawal')
      return
    }

    const tempWalletAddress = privateKeyToAddress(tmpWalletPrivateKey)

    // Check if there is a payment associated with this invite code
    const receivedPayment = yield call(getEscrowedPayment, escrow, tempWalletAddress)
    const value = new BigNumber(receivedPayment[3])
    if (!value.isGreaterThan(0)) {
      Logger.warn(TAG + '@withdrawFromEscrow', 'Escrow payment is empty, skipping.')
      return
    }

    const msgHash = contractKit.web3.utils.soliditySha3({ type: 'address', value: account })

    Logger.debug(TAG + '@withdrawFromEscrow', `Signing message hash ${msgHash}`)
    // use the temporary key to sign a message. The message is the current account.
    let signature: string = (yield contractKit.web3.eth.accounts.sign(msgHash, tmpWalletPrivateKey))
      .signature
    Logger.debug(TAG + '@withdrawFromEscrow', `Signed message hash signature is ${signature}`)
    signature = trimLeading0x(signature)
    const r = `0x${signature.slice(0, 64)}`
    const s = `0x${signature.slice(64, 128)}`
    const v = contractKit.web3.utils.hexToNumber(ensureLeading0x(signature.slice(128, 130)))

    // Generate and send the withdrawal transaction.
    const withdrawTx = escrow.withdraw(tempWalletAddress, v, r, s)
    const context = newTransactionContext(TAG, 'Withdraw from escrow')
    yield call(sendTransaction, withdrawTx.txo, account, context)

    yield put(fetchDollarBalance())
    Logger.showMessage(i18n.t('inviteFlow11:transferDollarsToAccount'))
    ValoraAnalytics.track(OnboardingEvents.escrow_redeem_complete)
  } catch (e) {
    Logger.error(TAG + '@withdrawFromEscrow', 'Error withdrawing payment from escrow', e)
    ValoraAnalytics.track(OnboardingEvents.escrow_redeem_error, { error: e.message })
    if (e.message === ErrorMessages.INCORRECT_PIN) {
      yield put(showError(ErrorMessages.INCORRECT_PIN))
    } else {
      yield put(showError(ErrorMessages.ESCROW_WITHDRAWAL_FAILED))
    }
  }
}

async function createReclaimTransaction(paymentID: string) {
  const contractKit = await getContractKitAsync()

  const escrow = await contractKit.contracts.getEscrow()
  return escrow.revoke(paymentID).txo
}

export async function getReclaimEscrowGas(account: string, paymentID: string) {
  Logger.debug(`${TAG}/getReclaimEscrowGas`, 'Getting gas estimate for escrow reclaim tx')
  const tx = await createReclaimTransaction(paymentID)
  const txParams = {
    from: account,
    feeCurrency: await getCurrencyAddress(CURRENCY_ENUM.DOLLAR),
  }
  const gas = await estimateGas(tx, txParams)
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
    ValoraAnalytics.track(EscrowEvents.escrow_reclaim_start)
    const account = yield call(getConnectedUnlockedAccount)

    const reclaimTx = yield call(createReclaimTransaction, paymentID)
    yield call(
      sendTransaction,
      reclaimTx,
      account,
      newTransactionContext(TAG, 'Reclaim escrowed funds')
    )

    yield put(fetchDollarBalance())
    yield put(fetchSentEscrowPayments())

    yield call(navigateHome)
    yield put(reclaimEscrowPaymentSuccess())
    ValoraAnalytics.track(EscrowEvents.escrow_reclaim_complete)
  } catch (e) {
    Logger.error(TAG + '@reclaimFromEscrow', 'Error reclaiming payment from escrow', e)
    ValoraAnalytics.track(EscrowEvents.escrow_reclaim_error, { error: e.message })
    if (e.message === ErrorMessages.INCORRECT_PIN) {
      yield put(showError(ErrorMessages.INCORRECT_PIN))
    } else {
      yield put(showError(ErrorMessages.RECLAIMING_ESCROWED_PAYMENT_FAILED))
    }
    yield put(reclaimEscrowPaymentFailure(e))
    yield put(fetchSentEscrowPayments())
  }
}

async function getEscrowedPayment(escrow: EscrowWrapper, paymentID: string) {
  Logger.debug(TAG + '@getEscrowedPayment', 'Fetching escrowed payment')

  try {
    const payment = await escrow.escrowedPayments(paymentID)
    return payment
  } catch (e) {
    Logger.error(TAG + '@getEscrowedPayment', 'Error fetching escrowed payment', e)
    throw e
  }
}

function* doFetchSentPayments() {
  Logger.debug(TAG + '@doFetchSentPayments', 'Fetching valid sent escrowed payments')

  try {
    ValoraAnalytics.track(EscrowEvents.escrow_fetch_start)
    const contractKit = yield call(getContractKit)

    const escrow: EscrowWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getEscrow,
    ])
    const account: string = yield call(getConnectedAccount)

    const sentPaymentIDs: string[] = yield call(escrow.getSentPaymentIds, account) // Note: payment ids are currently temp wallet addresses
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

    const addressToE164Number = yield select(addressToE164NumberSelector)
    const sentPayments: EscrowedPayment[] = []
    for (let i = 0; i < sentPaymentsRaw.length; i++) {
      const address = sentPaymentIDs[i].toLowerCase()
      const recipientPhoneNumber = addressToE164Number[address]
      const payment = sentPaymentsRaw[i]
      if (!payment) {
        continue
      }

      const escrowPaymentWithRecipient: EscrowedPayment = {
        paymentID: address,
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
    ValoraAnalytics.track(EscrowEvents.escrow_fetch_complete)
  } catch (e) {
    ValoraAnalytics.track(EscrowEvents.escrow_fetch_error, { error: e.message })
    Logger.error(TAG + '@doFetchSentPayments', 'Error fetching sent escrowed payments', e)
  }
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
  while (true) {
    const update: SetVerificationStatusAction = yield take(IdentityActions.SET_VERIFICATION_STATUS)
    if (update.status === VerificationStatus.Done) {
      // We wait for the next block because escrow can not
      // be redeemed without all the attestations completed
      yield waitForNextBlock()
      yield call(withdrawFromEscrow)
    }
  }
}

export function* escrowSaga() {
  yield spawn(watchTransferPayment)
  yield spawn(watchReclaimPayment)
  yield spawn(watchFetchSentPayments)
  yield spawn(watchVerificationEnd)
}
