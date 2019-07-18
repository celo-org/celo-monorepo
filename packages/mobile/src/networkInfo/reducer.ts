import { Actions, ActionTypes } from 'src/networkInfo/actions'

export interface State {
  connected: boolean // True if the phone thinks it has a data connection (cellular/Wi-Fi), false otherwise.
}

const initialState = {
  connected: false,
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.SET_CONNECTED:
      return {
        ...state,
        connected: action.connected,
      }
    default:
      return state
  }
}
