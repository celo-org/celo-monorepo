import { TokenTransactionType, TransactionFeedFragment } from 'src/apollo/types'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TransferConfirmationCardProps } from 'src/send/TransferConfirmationCard'
import { ConfirmationInput } from 'src/send/utils'
import { StandbyTransaction } from 'src/transactions/types'
import { web3ForUtils } from 'src/web3/contracts'

export enum Actions {
  ADD_STANDBY_TRANSACTION = 'TRANSACTIONS/ADD_STANDBY_TRANSACTION',
  REMOVE_STANDBY_TRANSACTION = 'TRANSACTIONS/REMOVE_STANDBY_TRANSACTION',
  RESET_STANDBY_TRANSACTIONS = 'TRANSACTIONS/RESET_STANDBY_TRANSACTIONS',
  ADD_HASH_TO_STANDBY_TRANSACTIONS = 'TRANSACTIONS/ADD_HASH_TO_STANDBY_TRANSACTIONS',
  TRANSACTION_CONFIRMED = 'TRANSACTIONS/TRANSACTION_CONFIRMED',
  TRANSACTION_FAILED = 'TRANSACTIONS/TRANSACTION_FAILED',
  NEW_TRANSACTIONS_IN_FEED = 'TRANSACTIONS/NEW_TRANSACTIONS_IN_FEED',
}

export interface AddStandbyTransactionAction {
  type: Actions.ADD_STANDBY_TRANSACTION
  transaction: StandbyTransaction
}

export interface RemoveStandbyTransactionAction {
  type: Actions.REMOVE_STANDBY_TRANSACTION
  idx: string
}

export interface ResetStandbyTransactionsAction {
  type: Actions.RESET_STANDBY_TRANSACTIONS
}

export interface AddHashToStandbyTransactionAction {
  type: Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS
  idx: string
  hash: string
}

export interface TransactionConfirmedAction {
  type: Actions.TRANSACTION_CONFIRMED
  txId: string
}

export interface TransactionFailedAction {
  type: Actions.TRANSACTION_FAILED
  txId: string
}

export interface NewTransactionsInFeedAction {
  type: Actions.NEW_TRANSACTIONS_IN_FEED
  transactions: TransactionFeedFragment[]
}

export type ActionTypes =
  | AddStandbyTransactionAction
  | RemoveStandbyTransactionAction
  | ResetStandbyTransactionsAction
  | AddHashToStandbyTransactionAction
  | NewTransactionsInFeedAction

export const generateStandbyTransactionId = (recipientAddress: string) => {
  return web3ForUtils.utils.sha3(recipientAddress + String(Date.now()))
}

export const addStandbyTransaction = (
  transaction: StandbyTransaction
): AddStandbyTransactionAction => ({
  type: Actions.ADD_STANDBY_TRANSACTION,
  transaction,
})

export const removeStandbyTransaction = (idx: string): RemoveStandbyTransactionAction => ({
  type: Actions.REMOVE_STANDBY_TRANSACTION,
  idx,
})

export const resetStandbyTransactions = (): ResetStandbyTransactionsAction => ({
  type: Actions.RESET_STANDBY_TRANSACTIONS,
})

export const transactionConfirmed = (txId: string): TransactionConfirmedAction => ({
  type: Actions.TRANSACTION_CONFIRMED,
  txId,
})

export const transactionFailed = (txId: string): TransactionFailedAction => ({
  type: Actions.TRANSACTION_FAILED,
  txId,
})

export const addHashToStandbyTransaction = (
  idx: string,
  hash: string
): AddHashToStandbyTransactionAction => ({
  type: Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS,
  idx,
  hash,
})

export const newTransactionsInFeed = (
  transactions: TransactionFeedFragment[]
): NewTransactionsInFeedAction => ({
  type: Actions.NEW_TRANSACTIONS_IN_FEED,
  transactions,
})

export const navigateToPaymentTransferReview = (
  type: string,
  timestamp: number,
  confirmationProps: TransferConfirmationCardProps
) => {
  let headerText = ''
  switch (type) {
    case TokenTransactionType.Sent:
      headerText = i18n.t('sendFlow7:sentPayment')
      break
    case TokenTransactionType.EscrowSent:
      headerText = i18n.t('sendFlow7:sentEscrowPayment')
      break
    case TokenTransactionType.Received:
      headerText = i18n.t('receiveFlow8:receivedPayment')
      break
    case TokenTransactionType.EscrowReceived:
      headerText = i18n.t('receiveFlow8:receivedEscrowPayment')
      break
    case TokenTransactionType.VerificationFee:
      headerText = i18n.t('walletFlow5:verificationFee')
      break
    case TokenTransactionType.Faucet:
      headerText = i18n.t('receiveFlow8:receivedDollars')
      break
    case TokenTransactionType.InviteSent:
      headerText = i18n.t('inviteFlow11:inviteComplete')
      break
    case TokenTransactionType.InviteReceived:
      headerText = i18n.t('inviteFlow11:inviteReceived')
      break
    case TokenTransactionType.NetworkFee:
      headerText = i18n.t('walletFlow5:networkFee')
      break
  }

  navigate(Screens.TransactionReview, {
    reviewProps: {
      type,
      timestamp,
      header: headerText,
    },
    confirmationProps,
  })
}

export const navigateToExchangeReview = (
  timestamp: number,
  confirmationProps: ExchangeConfirmationCardProps
) => {
  const { makerAmount } = confirmationProps
  const isSold = makerAmount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
  navigate(Screens.TransactionReview, {
    reviewProps: {
      type: TokenTransactionType.Exchange,
      timestamp,
      header: isSold ? i18n.t('exchangeFlow9:soldGold') : i18n.t('exchangeFlow9:purchasedGold'),
    },
    confirmationProps,
  })
}

export const navigateToRequestedPaymentReview = (confirmationInput: ConfirmationInput) => {
  navigate(Screens.SendConfirmation, { confirmationInput })
}
