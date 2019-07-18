import { RootState } from 'src/redux/reducers'

export const currentAccountSelector = (state: RootState) => state.web3.account

export const privateCommentKeySelector = (state: RootState) => state.web3.commentKey
