import { Result } from '@celo/base'
import { CeloTransactionObject, ContractKit } from '@celo/contractkit'
import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import { EscrowWrapper } from '@celo/contractkit/lib/wrappers/Escrow'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { KomenciKit } from '@celo/komencikit/lib/kit'
import { FetchError, TxError } from '@celo/komencikit/src/errors'
import { privateKeyToAddress } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'
import { all, call, put, race, select, spawn, take, takeLeading } from 'redux-saga/effects'
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
import { generateEscrowPaymentIdAndPk, generateUniquePaymentId } from 'src/escrow/utils'
import { calculateFee } from 'src/fees/saga'
import { features } from 'src/flags'
import { CURRENCY_ENUM, SHORT_CURRENCIES } from 'src/geth/consts'
import networkConfig from 'src/geth/networkConfig'
import { waitForNextBlock } from 'src/geth/saga'
import i18n from 'src/i18n'
import {
  Actions as IdentityActions,
  FeelessSetVerificationStatusAction,
  SetVerificationStatusAction,
} from 'src/identity/actions'
import { getUserSelfPhoneHashDetails } from 'src/identity/privateHashing'
import {
  addressToE164NumberSelector,
  FeelessVerificationState,
  feelessVerificationStateSelector,
} from 'src/identity/reducer'
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
import { mtwAddressSelector } from 'src/web3/selectors'
import { estimateGas } from 'src/web3/utils'
import { Sign } from 'web3-core'
import { TransactionReceipt } from 'web3-eth'

const TAG = 'escrow/saga'

function* transferToEscrow(action: EscrowTransferPaymentAction) {
  features.ESCROW_WITHOUT_CODE
    ? yield call(transferStableTokenToEscrowWithoutCode, action)
    : yield call(transferStableTokenToEscrow, action)
}

function* transferStableTokenToEscrow(action: EscrowTransferPaymentAction) {
  Logger.debug(TAG + '@transferToEscrow', 'Begin transfer to escrow')
  try {
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_start)
    const { phoneHashDetails, amount, tempWalletAddress, context } = action

    if (!tempWalletAddress) {
      throw Error(
        'No tempWalletAddress included with escrow tx. Should ESCROW_WITHOUT_CODE be enabled?'
      )
    }

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
      phoneHashDetails.phoneHash,
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

function* transferStableTokenToEscrowWithoutCode(action: EscrowTransferPaymentAction) {
  Logger.debug(TAG + '@transferToEscrowWithoutCode', 'Begin transfer to escrow')
  try {
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_start)
    const { phoneHashDetails, amount, context } = action
    const { phoneHash, pepper } = phoneHashDetails
    const [contractKit, walletAddress]: [ContractKit, string] = yield all([
      call(getContractKit),
      call(getConnectedUnlockedAccount),
    ])

    const [stableTokenWrapper, escrowWrapper]: [StableTokenWrapper, EscrowWrapper] = yield all([
      call([contractKit.contracts, contractKit.contracts.getStableToken]),
      call([contractKit.contracts, contractKit.contracts.getEscrow]),
    ])

    const escrowPaymentIds: string[] = yield call(
      [escrowWrapper, escrowWrapper.getReceivedPaymentIds],
      phoneHash
    )

    const paymentId: string | undefined = generateUniquePaymentId(
      escrowPaymentIds,
      phoneHash,
      pepper
    )

    if (!paymentId) {
      throw Error('Could not generate a unique paymentId for escrow. Should never happen')
    }

    // Approve a transfer of funds to the Escrow contract.
    Logger.debug(TAG + '@transferToEscrowWithoutCode', 'Approving escrow transfer')
    const convertedAmount = contractKit.web3.utils.toWei(amount.toString())
    const approvalTx = stableTokenWrapper.approve(escrowWrapper.address, convertedAmount)

    yield call(
      sendTransaction,
      approvalTx.txo,
      walletAddress,
      newTransactionContext(TAG, 'Approve transfer to Escrow')
    )
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_approve_tx_sent)

    // Tranfser the funds to the Escrow contract.
    Logger.debug(TAG + '@transferToEscrowWithoutCode', 'Transfering to escrow')
    yield call(registerStandbyTransaction, context, amount.toString(), escrowWrapper.address)

    const transferTx = escrowWrapper.transfer(
      phoneHash,
      stableTokenWrapper.address,
      convertedAmount,
      ESCROW_PAYMENT_EXPIRY_SECONDS,
      paymentId,
      NUM_ATTESTATIONS_REQUIRED
    )
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_transfer_tx_sent)
    yield call(sendAndMonitorTransaction, transferTx, walletAddress, context)
    yield put(fetchSentEscrowPayments())
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_complete)
  } catch (e) {
    ValoraAnalytics.track(EscrowEvents.escrow_transfer_error, { error: e.message })
    Logger.error(TAG + '@transferToEscrowWithoutCode', 'Error transfering to escrow', e)
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

async function formEscrowWithdrawAndTransferTxWithNoCode(
  contractKit: ContractKit,
  escrowWrapper: EscrowWrapper,
  stableTokenWrapper: StableTokenWrapper,
  paymentId: string,
  privateKey: string,
  walletAddress: string,
  metaTxWalletAddress: string,
  value: BigNumber
) {
  const msgHash = contractKit.web3.utils.soliditySha3({
    type: 'address',
    value: metaTxWalletAddress,
  })

  const { r, s, v }: Sign = await contractKit.web3.eth.accounts.sign(msgHash, privateKey)

  Logger.debug(TAG + '@withdrawFromEscrowViaKomenci', `Signed message hash signature`)
  const withdrawTx = escrowWrapper.withdraw(paymentId, v, r, s)
  const transferTx = stableTokenWrapper.transfer(walletAddress, value.toString())
  return { withdrawTx, transferTx }
}

function* withdrawFromEscrowUsingPepper(komenciActive: boolean = false) {
  try {
    ValoraAnalytics.track(OnboardingEvents.escrow_redeem_start)
    Logger.debug(TAG + '@withdrawFromEscrowUsingPepper', 'Withdrawing escrowed payment')
    const phoneHashDetails: PhoneNumberHashDetails | undefined = yield call(
      getUserSelfPhoneHashDetails
    )

    if (!phoneHashDetails) {
      throw Error('Couldnt find own phone hash or pepper. Should never happen.')
    }

    const { phoneHash, pepper } = phoneHashDetails
    const [contractKit, walletAddress, mtwAddress, feelessVerificationState]: [
      ContractKit,
      string,
      string,
      FeelessVerificationState
    ] = yield all([
      call(getContractKit),
      call(getConnectedUnlockedAccount),
      select(mtwAddressSelector),
      select(feelessVerificationStateSelector),
    ])

    const [stableTokenWrapper, escrowWrapper, mtwWrapper]: [
      StableTokenWrapper,
      EscrowWrapper,
      MetaTransactionWalletWrapper
    ] = yield all([
      call([contractKit.contracts, contractKit.contracts.getStableToken]),
      call([contractKit.contracts, contractKit.contracts.getEscrow]),
      call([contractKit.contracts, contractKit.contracts.getMetaTransactionWallet], mtwAddress),
    ])

    const escrowPaymentIds: string[] = yield call(
      [escrowWrapper, escrowWrapper.getReceivedPaymentIds],
      phoneHash
    )

    if (escrowPaymentIds.length === 0) {
      Logger.debug(TAG + '@withdrawFromEscrow', 'No pending payments in escrow')
      ValoraAnalytics.track(OnboardingEvents.escrow_redeem_complete)
      return
    }

    const paymentIdSet: Set<string> = new Set(escrowPaymentIds)

    const context = newTransactionContext(TAG, 'Withdraw from escrow')
    // TODO: Batch the tranasctions and submit them together via `executeTransactions`
    // method on an instance of the MTW then submitting like usual
    const withdrawTxSuccess: boolean[] = []
    // Using an upper bound of 100 to be sure this doesn't run forever
    for (let i = 0; i < 100 && paymentIdSet.size > 0; i += 1) {
      const { paymentId, privateKey } = generateEscrowPaymentIdAndPk(phoneHash, pepper, i)
      if (!paymentIdSet.has(paymentId)) {
        continue
      }
      paymentIdSet.delete(paymentId)

      const receivedPayment = yield call(getEscrowedPayment, escrowWrapper, paymentId)
      const value = new BigNumber(receivedPayment[3])
      if (!value.isGreaterThan(0)) {
        Logger.warn(TAG + '@withdrawFromEscrowUsingPepper', 'Escrow payment is empty, skipping.')
        continue
      }

      const {
        withdrawTx,
        transferTx,
      }: {
        withdrawTx: CeloTransactionObject<boolean>
        transferTx: CeloTransactionObject<boolean>
      } = yield formEscrowWithdrawAndTransferTxWithNoCode(
        contractKit,
        escrowWrapper,
        stableTokenWrapper,
        paymentId,
        privateKey,
        walletAddress,
        mtwAddress,
        value
      )

      try {
        if (!komenciActive) {
          const wrappedBatchTx = mtwWrapper.executeTransactions([withdrawTx.txo, transferTx.txo])
          yield call(sendTransaction, wrappedBatchTx.txo, walletAddress, context)
        } else {
          const komenciKit: KomenciKit = new KomenciKit(contractKit, walletAddress, {
            url: feelessVerificationState.komenci.callbackUrl || networkConfig.komenciUrl,
            token: feelessVerificationState.komenci.sessionToken,
          })
          // TODO: When Komenci supports batched subsidized transactions, batch these two txs
          // Currently not ideal that withdraw to MTW can succeed but transfer to EOA can fail but
          // there will be a service in place to transfer funds from MTW to EOA for users
          const withdrawTxResult: Result<TransactionReceipt, FetchError | TxError> = yield call(
            [komenciKit, komenciKit.submitMetaTransaction],
            mtwAddress,
            withdrawTx
          )

          if (!withdrawTxResult.ok) {
            throw withdrawTxResult.error
          }

          const transferTxResult: Result<TransactionReceipt, FetchError | TxError> = yield call(
            [komenciKit, komenciKit.submitMetaTransaction],
            mtwAddress,
            transferTx
          )

          if (!transferTxResult.ok) {
            throw transferTxResult.error
          }
        }
        withdrawTxSuccess.push(true)
      } catch (error) {
        withdrawTxSuccess.push(false)
        Logger.error(
          TAG + '@withdrawFromEscrowViaKomenci',
          'Unable to withdraw from escrow. Error: ',
          error
        )
      }
    }

    if (!withdrawTxSuccess.includes(true)) {
      throw Error('Unable to withdraw any pending escrow transactions')
    }

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
    const { r, s, v }: Sign = yield contractKit.web3.eth.accounts.sign(msgHash, tmpWalletPrivateKey)
    Logger.debug(TAG + '@withdrawFromEscrow', `Signed message hash signature`)

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
  yield takeLeading(Actions.TRANSFER_PAYMENT, transferToEscrow)
}

export function* watchReclaimPayment() {
  yield takeLeading(Actions.RECLAIM_PAYMENT, reclaimFromEscrow)
}

export function* watchFetchSentPayments() {
  yield takeLeading(Actions.FETCH_SENT_PAYMENTS, doFetchSentPayments)
}

export function* watchVerificationEnd() {
  while (true) {
    const [update, feelessUpdate]: [
      SetVerificationStatusAction,
      FeelessSetVerificationStatusAction
    ] = yield race([
      take(IdentityActions.SET_VERIFICATION_STATUS),
      take(IdentityActions.FEELESS_SET_VERIFICATION_STATUS),
    ])

    if (update?.status === VerificationStatus.Done) {
      // We wait for the next block because escrow can not
      // be redeemed without all the attestations completed
      yield waitForNextBlock()
      if (features.ESCROW_WITHOUT_CODE) {
        yield call(withdrawFromEscrowUsingPepper, false)
      } else {
        yield call(withdrawFromEscrow)
      }
    } else if (feelessUpdate?.status === VerificationStatus.Done) {
      yield waitForNextBlock()
      yield call(withdrawFromEscrowUsingPepper, true)
    }
  }
}

export function* escrowSaga() {
  yield spawn(watchTransferPayment)
  yield spawn(watchReclaimPayment)
  yield spawn(watchFetchSentPayments)
  yield spawn(watchVerificationEnd)
}
