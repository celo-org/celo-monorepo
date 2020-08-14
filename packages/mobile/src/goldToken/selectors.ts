import { RootState } from 'src/redux/reducers'

export function getCeloBalance(state: RootState) {
  return state.goldToken.balance
}
