import { RootState } from 'src/redux/reducers'

export function getDollarBalance(state: RootState) {
  return state.stableToken.balance
}
