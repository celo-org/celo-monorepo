export enum Actions {
  UPDATE_DEFAULT_FEE = 'FEES/UPDATE_DEFAULT_FEE',
  DEFAULT_FEE_UPDATED = 'FEES/DEFAULT_FEE_UPDATED',
}

export enum FeeType {
  INVITE = 'invite',
  SEND = 'send',
  EXCHANGE = 'exchange',
  ESCROW = 'escrow',
}

export interface UpdateDefaultFeeAction {
  type: Actions.UPDATE_DEFAULT_FEE
  feeType: FeeType
}

export interface DefaultFeeUpdatedAction {
  type: Actions.DEFAULT_FEE_UPDATED
  feeType: FeeType
  feeInWei: string
}

export type ActionTypes = UpdateDefaultFeeAction | DefaultFeeUpdatedAction

export const updateDefaultFee = (feeType: FeeType): UpdateDefaultFeeAction => ({
  type: Actions.UPDATE_DEFAULT_FEE,
  feeType,
})

export const defaultFeeUpdated = (feeType: FeeType, feeInWei: string): DefaultFeeUpdatedAction => ({
  type: Actions.DEFAULT_FEE_UPDATED,
  feeType,
  feeInWei,
})
