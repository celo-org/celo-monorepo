import { AddressToRecipient, NumberToRecipient } from 'src/recipients/recipient'

export enum Actions {
  SET_PHONE_RECIPIENT_CACHE = 'RECIPIENTS/SET_PHONE_RECIPIENT_CACHE',
  UPDATE_VALORA_RECIPIENT_CACHE = 'RECIPIENTS/SET_VALORA_RECIPIENT_CACHE',
}

export interface SetPhoneRecipientCacheAction {
  type: Actions.SET_PHONE_RECIPIENT_CACHE
  recipients: NumberToRecipient
}

export interface UpdateValoraRecipientCacheAction {
  type: Actions.UPDATE_VALORA_RECIPIENT_CACHE
  recipients: AddressToRecipient
}

export type ActionTypes = SetPhoneRecipientCacheAction | UpdateValoraRecipientCacheAction

export const setPhoneRecipientCache = (
  recipients: NumberToRecipient
): SetPhoneRecipientCacheAction => ({
  type: Actions.SET_PHONE_RECIPIENT_CACHE,
  recipients,
})

export const updateValoraRecipientCache = (
  recipients: AddressToRecipient
): UpdateValoraRecipientCacheAction => ({
  type: Actions.UPDATE_VALORA_RECIPIENT_CACHE,
  recipients,
})
