import * as dotProp from 'dot-prop-immutable'
import { Actions, ActionTypes, Invitees } from 'src/invite/actions'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export interface State {
  isSendingInvite: boolean
  isRedeemingInvite: boolean
  invitees: Invitees
  redeemComplete: boolean
  redeemedInviteCode: string
}

export const initialState: State = {
  isSendingInvite: false,
  isRedeemingInvite: false,
  invitees: {},
  redeemComplete: false,
  redeemedInviteCode: '',
}

export const inviteReducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'invite'),
        isSendingInvite: false,
      }
    }
    case Actions.SEND_INVITE:
      return {
        ...state,
        isSendingInvite: true,
      }
    case Actions.SEND_INVITE_FAILURE:
      return {
        ...state,
        isSendingInvite: false,
      }
    case Actions.STORE_INVITEE_DATA:
      return dotProp.merge(state, 'invitees', { [action.address]: action.e164Number })
    case Actions.REDEEM_INVITE:
      return {
        ...state,
        redeemedInviteCode: action.inviteCode,
        isRedeemingInvite: true,
      }
    case Actions.REDEEM_INVITE_SUCCESS:
      return {
        ...state,
        redeemComplete: true,
        isRedeemingInvite: false,
      }
    case Actions.REDEEM_INVITE_FAILURE:
      return {
        ...state,
        redeemComplete: false,
        isRedeemingInvite: false,
      }
    default:
      return state
  }
}

export const inviteesSelector = (state: RootState) => state.invite.invitees
