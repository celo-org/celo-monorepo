import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { FeeType } from 'src/fees/actions'
import { RootState } from 'src/redux/reducers'
import { divideByWei } from 'src/utils/formatting'

const getInviteFeeEstimate = (state: RootState) => state.fees.invite.feeInWei
const getSendFeeEstimate = (state: RootState) => state.fees.send.feeInWei
const getExchangeFeeEstimate = (state: RootState) => state.fees.exchange.feeInWei
const getEscrowFeeEstimate = (state: RootState) => state.fees.escrow.feeInWei

const feeEstimateSelectorFactory = (feeSelector: (state: RootState) => string | null) => {
  return createSelector(feeSelector, (feeInWei) => {
    if (!feeInWei) {
      return null
    }
    const adjustedFee = divideByWei(feeInWei, 18)
    return new BigNumber(adjustedFee)
  })
}

export const getInviteFeeEstimateDollars = feeEstimateSelectorFactory(getInviteFeeEstimate)
export const getSendFeeEstimateDollars = feeEstimateSelectorFactory(getSendFeeEstimate)
export const getExchangeFeeEstimateDollars = feeEstimateSelectorFactory(getExchangeFeeEstimate)
export const getEscrowFeeEstimateDollars = feeEstimateSelectorFactory(getEscrowFeeEstimate)

export const getFeeEstimateDollars = (state: RootState, feeType: FeeType) => {
  switch (feeType) {
    case FeeType.INVITE:
      return getInviteFeeEstimate(state)
    case FeeType.SEND:
      return getSendFeeEstimate(state)
    case FeeType.EXCHANGE:
      return getExchangeFeeEstimate(state)
    case FeeType.ESCROW:
      return getEscrowFeeEstimate(state)
  }
}
