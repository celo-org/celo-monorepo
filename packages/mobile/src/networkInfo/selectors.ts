import { RootState } from 'src/redux/reducers'

export const networkConnectedSelector = (state: RootState) => state.networkInfo.connected
