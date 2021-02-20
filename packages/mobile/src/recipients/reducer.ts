import { Actions, ActionTypes } from 'src/recipients/actions'
import { AddressToRecipient, NumberToRecipient } from 'src/recipients/recipient'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export interface State {
  // phoneRecipientCache contains the processed contact data imported from the
  // phone for a single app session.
  // Think of contacts as raw data and recipients as filtered data
  // No relation to recent recipients, which is in /send/reducer.ts
  phoneRecipientCache: NumberToRecipient
  // valoraRecipientCache contains accounts that the user has sent/recieved transactions from,
  // and includes CIP8 profile data if available
  valoraRecipientCache: AddressToRecipient
}

const initialState = {
  phoneRecipientCache: {},
  valoraRecipientCache: {},
}

export const recipientsReducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
) => {
  switch (action.type) {
    case REHYDRATE: {
      return {
        ...state,
        ...getRehydratePayload(action, 'recipients'),
        phoneRecipientCache: initialState.phoneRecipientCache,
      }
    }
    case Actions.SET_PHONE_RECIPIENT_CACHE:
      return {
        ...state,
        phoneRecipientCache: action.recipients,
      }
    case Actions.UPDATE_VALORA_RECIPIENT_CACHE:
      return {
        ...state,
        valoraRecipientCache: { ...state.valoraRecipientCache, ...action.recipients },
      }
    default:
      return state
  }
}

export const phoneRecipientCacheSelector = (state: RootState) =>
  state.recipients.phoneRecipientCache
export const valoraRecipientCacheSelector = (state: RootState) =>
  state.recipients.valoraRecipientCache

export const recipientInfoSelector = (state: RootState) => {
  return {
    addressToE164Number: state.identity.addressToE164Number,
    phoneRecipientCache: state.recipients.phoneRecipientCache,
    valoraRecipientCache: state.recipients.valoraRecipientCache,
    addressToDisplayName: state.identity.addressToDisplayName,
  }
}
