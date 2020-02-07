import { RootState } from 'src/redux/reducers'

export const getLockWithPinEnabled = (state: RootState) => {
  return state.app.lockWithPinEnabled
}
