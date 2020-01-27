import { RootState } from 'src/redux/reducers'

export const currentAccountSelector = (state: RootState) =>
  (state.web3.account && state.web3.account.toLowerCase()) || null
export const currentAccountInWeb3KeystoreSelector = (state: RootState) =>
  state.web3.accountInWeb3Keystore
export const fornoSelector = (state: RootState) => state.web3.fornoMode
export const gethStartedThisSessionSelector = (state: RootState) =>
  state.web3.gethStartedThisSession

export const privateCommentKeySelector = (state: RootState) => state.web3.commentKey
