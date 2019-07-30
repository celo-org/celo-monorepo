import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { FeeType } from 'src/fees/actions'
import { RootState } from 'src/redux/reducers'
import { divideByWei } from 'src/utils/formatting'

const getInviteFeeEstimate = (state: RootState) => state.fees.invite.feeInWei
const getSendFeeEstimate = (state: RootState) => state.fees.send.feeInWei
const getExchangeFeeEstimate = (state: RootState) => state.fees.exchange.feeInWei
const getEscrowFeeEstimate = (state: RootState) => state.fees.escrow.feeInWei

export function getFeeDollars(feeInWei: BigNumber | string) {
  const adjustedFee = divideByWei(
    feeInWei instanceof BigNumber ? feeInWei.toString() : feeInWei,
    18
  )
  return new BigNumber(adjustedFee)
}

const feeEstimateSelectorFactory = (feeSelector: (state: RootState) => string | null) => {
  return createSelector(feeSelector, (feeInWei) => {
    if (!feeInWei) {
      return null
    }
    return getFeeDollars(feeInWei)
  })
}

export const getInviteFeeEstimateDollars = feeEstimateSelectorFactory(getInviteFeeEstimate)
export const getSendFeeEstimateDollars = feeEstimateSelectorFactory(getSendFeeEstimate)
export const getExchangeFeeEstimateDollars = feeEstimateSelectorFactory(getExchangeFeeEstimate)
export const getEscrowFeeEstimateDollars = feeEstimateSelectorFactory(getEscrowFeeEstimate)

export const getFeeEstimateDollars = (state: RootState, feeType: FeeType) => {
  switch (feeType) {
    case FeeType.INVITE:
      return getInviteFeeEstimateDollars(state)
    case FeeType.SEND:
      return getSendFeeEstimateDollars(state)
    case FeeType.EXCHANGE:
      return getExchangeFeeEstimateDollars(state)
    case FeeType.ESCROW:
      return getEscrowFeeEstimateDollars(state)
  }
}
