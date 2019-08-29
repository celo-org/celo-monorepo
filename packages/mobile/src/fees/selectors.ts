import BigNumber from 'bignumber.js'
import { FeeType } from 'src/fees/actions'
import { RootState } from 'src/redux/reducers'
import { divideByWei } from 'src/utils/formatting'

export function getFeeDollars(feeInWei: BigNumber.Value | null | undefined) {
  return feeInWei ? divideByWei(feeInWei) : undefined
}

export function getFeeEstimateDollars(state: RootState, feeType: FeeType | null) {
  if (feeType === null) {
    return undefined
  }

  switch (feeType) {
    case FeeType.INVITE:
      return getFeeDollars(state.fees.estimates.invite.feeInWei)
    case FeeType.SEND:
      return getFeeDollars(state.fees.estimates.send.feeInWei)
    case FeeType.EXCHANGE:
      return getFeeDollars(state.fees.estimates.exchange.feeInWei)
    case FeeType.RECLAIM_ESCROW:
      return getFeeDollars(state.fees.estimates.reclaimEscrow.feeInWei)
  }
}
