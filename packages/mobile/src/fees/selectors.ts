import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { FeeType } from 'src/fees/actions'
import { RootState } from 'src/redux/reducers'
import { divideByWei } from 'src/utils/formatting'

const getInviteFeeEstimateInWei = (state: RootState) => state.fees.estimates.invite.feeInWei
const getSendFeeEstimateInWei = (state: RootState) => state.fees.estimates.send.feeInWei
const getExchangeFeeEstimateInWei = (state: RootState) => state.fees.estimates.exchange.feeInWei
const getReclaimEscrowFeeEstimateInWei = (state: RootState) =>
  state.fees.estimates.reclaimEscrow.feeInWei

export function getFeeDollars(feeInWei: BigNumber.Value | null | undefined) {
  return feeInWei ? divideByWei(feeInWei) : undefined
}

function feeEstimateDollarsSelectorFactory(feeSelector: (state: RootState) => string | null) {
  return createSelector(feeSelector, (feeInWei) => getFeeDollars(feeInWei))
}

export const getInviteFeeEstimateDollars = feeEstimateDollarsSelectorFactory(
  getInviteFeeEstimateInWei
)
export const getSendFeeEstimateDollars = feeEstimateDollarsSelectorFactory(getSendFeeEstimateInWei)
export const getExchangeFeeEstimateDollars = feeEstimateDollarsSelectorFactory(
  getExchangeFeeEstimateInWei
)
export const getReclaimEscrowFeeEstimateDollars = feeEstimateDollarsSelectorFactory(
  getReclaimEscrowFeeEstimateInWei
)

export function getFeeEstimateDollars(feeType: FeeType | null) {
  return (state: RootState) => {
    if (feeType === null) {
      return undefined
    }

    switch (feeType) {
      case FeeType.INVITE:
        return getInviteFeeEstimateDollars(state)
      case FeeType.SEND:
        return getSendFeeEstimateDollars(state)
      case FeeType.EXCHANGE:
        return getExchangeFeeEstimateDollars(state)
      case FeeType.RECLAIM_ESCROW:
        return getReclaimEscrowFeeEstimateDollars(state)
    }
  }
}
