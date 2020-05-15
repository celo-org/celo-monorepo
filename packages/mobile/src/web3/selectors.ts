import { RootState } from 'src/redux/reducers'

export const fornoSelector = (state: RootState) => state.web3.fornoMode
export const contractKitReadySelector = (state: RootState) => state.web3.contractKitReady
