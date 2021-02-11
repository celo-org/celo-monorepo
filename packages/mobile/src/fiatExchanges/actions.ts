export enum Actions {
  BIDALI_PAYMENT_REQUESTED = 'FIAT_EXCHANGES/BIDALI_PAYMENT_REQUESTED',
  SELECT_PROVIDER = 'FIAT_EXCHANGES/SELECT_PROVIDER',
  ASSIGN_PROVIDER_TO_TX_HASH = 'FIAT_EXCHANGES/ASSIGN_PROVIDER_TO_TX_HASH',
}

export interface BidaliPaymentRequestedAction {
  type: Actions.BIDALI_PAYMENT_REQUESTED
  address: string
  amount: string
  currency: string
  description: string
  chargeId: string
  onPaymentSent: () => void
  onCancelled: () => void
}

export const bidaliPaymentRequested = (
  address: string,
  amount: string,
  currency: string,
  description: string,
  chargeId: string,
  onPaymentSent: () => void,
  onCancelled: () => void
): BidaliPaymentRequestedAction => ({
  type: Actions.BIDALI_PAYMENT_REQUESTED,
  address,
  amount,
  currency,
  description,
  chargeId,
  onPaymentSent,
  onCancelled,
})

export interface SelectProviderAction {
  type: Actions.SELECT_PROVIDER
  name: string
  icon: string
}

export const selectProvider = (name: string, icon: string): SelectProviderAction => ({
  type: Actions.SELECT_PROVIDER,
  name,
  icon,
})

export interface AssignProviderToTxHashAction {
  type: Actions.ASSIGN_PROVIDER_TO_TX_HASH
  txHash: string
  currencyCode: string
}

export const assignProviderToTxHash = (
  txHash: string,
  currencyCode: string
): AssignProviderToTxHashAction => ({
  type: Actions.ASSIGN_PROVIDER_TO_TX_HASH,
  txHash,
  currencyCode,
})

export type ActionTypes =
  | BidaliPaymentRequestedAction
  | SelectProviderAction
  | AssignProviderToTxHashAction
