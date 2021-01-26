export enum Actions {
  BIDALI_PAYMENT_REQUESTED = 'FIAT_EXCHANGES/BIDALI_PAYMENT_REQUESTED',
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

export type ActionTypes = BidaliPaymentRequestedAction

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
