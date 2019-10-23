import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { ConfirmationInput as SendConfirmationCardProps } from 'src/send/SendConfirmation'
import { TransferConfirmationCardProps } from 'src/send/TransferConfirmationCard'
import { StandbyTransaction, TransactionTypes } from 'src/transactions/reducer'
import { web3 } from 'src/web3/contracts'

export enum Actions {
  ADD_STANDBY_TRANSACTION = 'TRANSACTIONS/ADD_STANDBY_TRANSACTION',
  REMOVE_STANDBY_TRANSACTION = 'TRANSACTIONS/REMOVE_STANDBY_TRANSACTION',
  RESET_STANDBY_TRANSACTIONS = 'TRANSACTIONS/RESET_STANDBY_TRANSACTIONS',
  ADD_HASH_TO_STANDBY_TRANSACTIONS = 'TRANSACTIONS/ADD_HASH_TO_STANDBY_TRANSACTIONS',
  TRANSACTION_CONFIRMED = 'TRANSACTIONS/TRANSACTION_CONFIRMED',
}

export interface AddStandbyTransaction {
  type: Actions.ADD_STANDBY_TRANSACTION
  transaction: StandbyTransaction
}

export interface RemoveStandbyTransaction {
  type: Actions.REMOVE_STANDBY_TRANSACTION
  idx: string
}

export interface ResetStandbyTransactions {
  type: Actions.RESET_STANDBY_TRANSACTIONS
}

export interface AddHashToStandbyTransaction {
  type: Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS
  idx: string
  hash: string
}

export interface TransactionConfirmed {
  type: Actions.TRANSACTION_CONFIRMED
  txId: string
}

export type ActionTypes =
  | AddStandbyTransaction
  | RemoveStandbyTransaction
  | ResetStandbyTransactions
  | AddHashToStandbyTransaction

export const generateStandbyTransactionId = (recipientAddress: string) => {
  return web3.utils.sha3(recipientAddress + String(Date.now()))
}

export const addStandbyTransaction = (transaction: StandbyTransaction): AddStandbyTransaction => ({
  type: Actions.ADD_STANDBY_TRANSACTION,
  transaction,
})

export const removeStandbyTransaction = (idx: string): RemoveStandbyTransaction => ({
  type: Actions.REMOVE_STANDBY_TRANSACTION,
  idx,
})

export const resetStandbyTransactions = (): ResetStandbyTransactions => ({
  type: Actions.RESET_STANDBY_TRANSACTIONS,
})

export const transactionConfirmed = (txId: string): TransactionConfirmed => ({
  type: Actions.TRANSACTION_CONFIRMED,
  txId,
})

export const addHashToStandbyTransaction = (
  idx: string,
  hash: string
): AddHashToStandbyTransaction => ({
  type: Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS,
  idx,
  hash,
})

export const navigateToPaymentTransferReview = (
  type: string,
  timestamp: number,
  confirmationProps: TransferConfirmationCardProps
) => {
  let headerText = ''
  switch (type) {
    case TransactionTypes.SENT:
      headerText = i18n.t('sendFlow7:sentPayment')
      break
    case TransactionTypes.RECEIVED:
      headerText = i18n.t('receiveFlow8:receivedPayment')
      break
    case TransactionTypes.VERIFICATION_FEE:
      headerText = i18n.t('walletFlow5:verificationFee')
      break
    case TransactionTypes.FAUCET:
      headerText = i18n.t('receiveFlow8:receivedDollars')
      break
    case TransactionTypes.INVITE_SENT:
      headerText = i18n.t('inviteFlow11:inviteComplete')
      break
    case TransactionTypes.INVITE_RECEIVED:
      headerText = i18n.t('inviteFlow11:inviteReceived')
      break
    case TransactionTypes.NETWORK_FEE:
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
  navigate(Screens.TransactionReview, {
    reviewProps: {
      type: TransactionTypes.EXCHANGE,
      timestamp,
      header: i18n.t('exchangeFlow9:exchange'),
    },
    confirmationProps,
  })
}

export const navigateToRequestedPaymentReview = (confirmationInput: SendConfirmationCardProps) => {
  navigate(Screens.SendConfirmation, { confirmationInput })
}
