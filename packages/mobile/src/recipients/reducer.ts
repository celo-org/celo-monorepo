import { Actions, ActionTypes } from 'src/recipients/actions'
import { NumberToRecipient } from 'src/recipients/recipient'
import { RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export interface State {
  recipientCache: NumberToRecipient
}

const initialState = {
  recipientCache: {},
}

export const recipientsReducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
) => {
  switch (action.type) {
    case Actions.SET_RECIPIENT_CACHE:
      return {
        ...state,
        recipientCache: action.recipients,
      }
    default:
      return state
  }
}

export const recipientCacheSelector = (state: RootState) => state.recipients.recipientCache
