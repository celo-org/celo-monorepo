import { RootState } from 'src/redux/reducers'

export const getRecentPayments = (state: RootState) => {
  return state.send.recentPayments
}
