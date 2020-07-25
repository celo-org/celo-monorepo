import { RootState } from 'src/redux/reducers'

export const currentAccountSelector = (state: RootState) =>
  (state.web3.account && state.web3.account.toLowerCase()) || null
export const currentAccountInWeb3KeystoreSelector = (state: RootState) =>
  state.web3.accountInWeb3Keystore
export const fornoSelector = (state: RootState) => state.web3.fornoMode
export const dataEncryptionKeySelector = (state: RootState) => state.web3.commentKey
export const isDekRegisteredSelector = (state: RootState) => state.web3.isDekRegistered
