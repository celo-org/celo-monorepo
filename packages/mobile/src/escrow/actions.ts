import { getEscrowContract, getStableTokenContract } from '@celo/contractkit/src/contracts'
import BigNumber from 'bignumber.js'
import { SHORT_CURRENCIES } from 'src/geth/consts'
import { DispatchType, GetStateType } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { RecipientWithContact } from 'src/utils/recipient'
import { web3 } from 'src/web3/contracts'
import { fetchGasPrice } from 'src/web3/gas'
import { currentAccountSelector } from 'src/web3/selectors'

export interface EscrowedPayment {
  senderAddress: string
  recipientPhone: string
  recipientContact?: RecipientWithContact
  paymentID: string
  currency: SHORT_CURRENCIES
  amount: BigNumber
  message?: string
  timestamp: BigNumber
  expirySeconds: BigNumber
}

// The number of seconds before the sender can reclaim the payment.
export const EXPIRY_SECONDS = 1

export enum Actions {
  TRANSFER_PAYMENT = 'ESCROW/TRANSFER_PAYMENT',
  RECLAIM_PAYMENT = 'ESCROW/RECLAIM_PAYMENT',
  GET_SENT_PAYMENTS = 'ESCROW/GET_SENT_PAYMENTS',
  STORE_SENT_PAYMENTS = 'ESCROW/STORE_SENT_PAYMENTS',
  RESEND_PAYMENT = 'ESCROW/RESEND_PAYMENT',
  FETCH_RECLAIM_TRANSACTION_FEE = 'ESCROW/FETCH_RECLAIM_TRANSACTION_FEE',
  SET_RECLAIM_TRANSACTION_FEE = 'ESCROW/SET_RECLAIM_TRANSACTION_FEE',
}

const TAG = 'escrow/actions'

export interface TransferPaymentAction {
  type: Actions.TRANSFER_PAYMENT
  phoneHash: string
  amount: BigNumber
  txId: string
  tempWalletAddress: string
}
export interface ReclaimPaymentAction {
  type: Actions.RECLAIM_PAYMENT
  paymentID: string
}

export interface GetSentPaymentsAction {
  type: Actions.GET_SENT_PAYMENTS
}

export interface StoreSentPaymentsAction {
  type: Actions.STORE_SENT_PAYMENTS
  sentPayments: EscrowedPayment[]
}

export interface ResendPaymentAction {
  type: Actions.RESEND_PAYMENT
  paymentId: string
}

export interface SetReclaimTransactionFeeAction {
  type: Actions.SET_RECLAIM_TRANSACTION_FEE
  suggestedFee: string
}

export type ActionTypes =
  | TransferPaymentAction
  | ReclaimPaymentAction
  | GetSentPaymentsAction
  | StoreSentPaymentsAction
  | ResendPaymentAction
  | SetReclaimTransactionFeeAction

export const transferEscrowedPayment = (
  phoneHash: string,
  amount: BigNumber,
  txId: string,
  tempWalletAddress: string
): TransferPaymentAction => ({
  type: Actions.TRANSFER_PAYMENT,
  phoneHash,
  amount,
  txId,
  tempWalletAddress,
})

export const reclaimPayment = (paymentID: string): ReclaimPaymentAction => ({
  type: Actions.RECLAIM_PAYMENT,
  paymentID,
})

export const getSentPayments = (): GetSentPaymentsAction => ({
  type: Actions.GET_SENT_PAYMENTS,
})

export const storeSentPayments = (sentPayments: EscrowedPayment[]): StoreSentPaymentsAction => ({
  type: Actions.STORE_SENT_PAYMENTS,
  sentPayments,
})

export const resendPayment = (paymentId: string): ResendPaymentAction => ({
  type: Actions.RESEND_PAYMENT,
  paymentId,
})

export const setReclaimTransactionFee = (suggestedFee: string): SetReclaimTransactionFeeAction => ({
  type: Actions.SET_RECLAIM_TRANSACTION_FEE,
  suggestedFee,
})

export const fetchReclaimSuggestedFee = (paymentID: string) => async (
  dispatch: DispatchType,
  getState: GetStateType
) => {
  try {
    Logger.debug(`${TAG}/fetchSuggestedFee`, `Fetching reclaim transaction fee`)
    const escrow = await getEscrowContract(web3)
    const stableToken = await getStableTokenContract(web3)
    const account = currentAccountSelector(getState())

    const mockReclaimTx = await escrow.methods.revoke(paymentID)

    const mockTxParams: any = { from: account, gasCurrency: stableToken._address }
    const gas: BigNumber = new BigNumber(await mockReclaimTx.estimateGas(mockTxParams))
    const gasPrice: BigNumber = new BigNumber(await fetchGasPrice())

    const suggestedFeeInWei: BigNumber = gas.multipliedBy(gasPrice)

    dispatch(setReclaimTransactionFee(suggestedFeeInWei.toString()))
    Logger.debug(`${TAG}/fetchSuggestedFee`, `New reclaim tx fee is: ${suggestedFeeInWei}`)
    return suggestedFeeInWei
  } catch (error) {
    Logger.error(`${TAG}/fetchSuggestedFee`, 'Error fetching reclaim transaction fee', error)
    throw error
  }
}
