import { NumberToRecipient } from 'src/recipients/recipient'

export enum Actions {
  SET_RECIPIENT_CACHE = 'SEND/SET_RECIPIENT_CACHE',
}

export interface SetRecipientCacheAction {
  type: Actions.SET_RECIPIENT_CACHE
  recipients: NumberToRecipient
}

export type ActionTypes = SetRecipientCacheAction

export const setRecipientCache = (recipients: NumberToRecipient): SetRecipientCacheAction => ({
  type: Actions.SET_RECIPIENT_CACHE,
  recipients,
})
