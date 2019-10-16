import { RootState } from 'src/redux/reducers'

export const currentAccountSelector = (state: RootState) => state.web3.account
export const zeroSyncSelector = (state: RootState) => state.web3.zeroSyncMode

export const privateCommentKeySelector = (state: RootState) => state.web3.commentKey
