import { RootState } from 'src/redux/reducers'

export const getCeloBalance = (state: RootState) => state.goldToken.balance
