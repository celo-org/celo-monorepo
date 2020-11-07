import { Actions, ActionTypes } from 'src/recipients/actions'
import { NumberToRecipient } from 'src/recipients/recipient'
import { RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export interface State {
  // RecipientCache contains the processed contact data imported from the
  // phone for a single app session.
  // Think of contacts as raw data and recipients as filtered data
  // No relation to recent recipients, which is in /send/reducer.ts
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
