export enum Actions {
  ESTIMATE_FEE = 'FEES/ESTIMATE_FEE',
  FEE_ESTIMATED = 'FEES/FEE_ESTIMATED',
}

export enum FeeType {
  INVITE = 'invite',
  SEND = 'send',
  EXCHANGE = 'exchange',
  RECLAIM_ESCROW = 'reclaim-escrow',
}

export interface EstimateFeeAction {
  type: Actions.ESTIMATE_FEE
  feeType: FeeType
}

export interface FeeEstimatedAction {
  type: Actions.FEE_ESTIMATED
  feeType: FeeType
  feeInWei: string
}

export type ActionTypes = EstimateFeeAction | FeeEstimatedAction

export const estimateFee = (feeType: FeeType): EstimateFeeAction => ({
  type: Actions.ESTIMATE_FEE,
  feeType,
})

export const feeEstimated = (feeType: FeeType, feeInWei: string): FeeEstimatedAction => ({
  type: Actions.FEE_ESTIMATED,
  feeType,
  feeInWei,
})
