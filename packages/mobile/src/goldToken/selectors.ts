import { RootState } from 'src/redux/reducers'

export const celoTokenBalanceSelector = (state: RootState) => state.goldToken.balance
