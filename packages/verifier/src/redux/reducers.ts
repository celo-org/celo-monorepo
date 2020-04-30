import { combineReducers } from 'redux'
import { reducer as app, State as AppState } from 'src/app/reducer'

export default combineReducers({
  app,
})

export interface RootState {
  app: AppState
}
