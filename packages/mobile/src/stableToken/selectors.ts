import { RootState } from 'src/redux/reducers'
export const dollarBalanceSelector = (state: RootState) => state.stableToken.balance
