import { RootState } from 'src/redux/reducers'

export const getRecentPayments = (state: RootState) => {
  return state.send.recentPayments
}

export const isSendingSelector = (state: RootState) => {
  return state.send.isSending
}
