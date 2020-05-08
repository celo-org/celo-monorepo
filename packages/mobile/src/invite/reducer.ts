import { Actions, ActionTypes, InviteDetails } from 'src/invite/actions'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export interface State {
  isSendingInvite: boolean
  isRedeemingInvite: boolean
  isSkippingInvite: boolean
  invitees: InviteDetails[]
  redeemComplete: boolean
  redeemedInviteCode: string
}

export const initialState: State = {
  isSendingInvite: false,
  isRedeemingInvite: false,
  isSkippingInvite: false,
  invitees: [],
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
        isRedeemingInvite: false,
        isSkippingInvite: false,
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
      // TODO(Rossy / Tarik) decide on UI for showing users the invite codes they've sent, see #2639
      return {
        ...state,
        invitees: [...state.invitees, action.inviteDetails],
      }
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
    case Actions.SKIP_INVITE:
      return {
        ...state,
        isSkippingInvite: true,
      }
    case Actions.SKIP_INVITE_SUCCESS:
      return {
        ...state,
        redeemComplete: true,
        isSkippingInvite: false,
      }
    case Actions.SKIP_INVITE_FAILURE:
      return {
        ...state,
        redeemComplete: false,
        isSkippingInvite: false,
      }
    default:
      return state
  }
}

export const inviteesSelector = (state: RootState) => state.invite.invitees
