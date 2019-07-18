import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { RootState } from 'src/redux/reducers'
import { divideByWei } from 'src/utils/formatting'

const getSuggestedFee = (state: RootState) => state.send.suggestedFee

export const getSuggestedFeeDollars = createSelector([getSuggestedFee], (suggestedFee) => {
  const adjustedFee = divideByWei(suggestedFee, 18)
  return new BigNumber(adjustedFee)
})
