import dotProp from 'dot-prop-immutable'
import { Actions } from 'src/home/actions'

export interface State {
  loading: boolean
  notifications: any[]
}

const initialState = {
  loading: false,
  notifications: [],
}

export const homeReducer = (state: State = initialState, action: any) => {
  switch (action.type) {
    case Actions.SET_LOADING:
      return {
        ...state,
        loading: action.loading,
      }
    case Actions.ADD_NOTIFICATION:
      return dotProp.set(state, 'notifications', (list: any) => [
        action.payload.notification,
        ...list,
      ])
    case Actions.SET_NOTIFICATION:
      return dotProp.set(
        state,
        `notifications.${action.payload.index}`,
        action.payload.notification
      )
    default:
      return state
  }
}
