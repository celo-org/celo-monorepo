import getConfig from 'next/config'
import { RequestStatus, RequestType } from '../../server/FirebaseClient'

export function getCaptchaKey() {
  return getConfig().publicRuntimeConfig.RECAPTCHA
}

export function validateBeneficary(addressOrE164: string, kind: RequestType) {
  if (kind === RequestType.Invite) {
    return validateNumber(addressOrE164)
  } else {
    return validateAddress(addressOrE164)
  }
}

function validateNumber(number: string) {
  //  TODO use our phone utils from @celo/utils
  const E164RegEx = /^\+[1-9][0-9]{1,14}$/
  return E164RegEx.test(number)
}

// TODO actually validate
export function validateAddress(address: string) {
  return address.length > 0
}

export function requestStatusToState(status: RequestStatus) {
  switch (status) {
    case RequestStatus.Done:
      return RequestState.Completed
    case RequestStatus.Failed:
      return RequestState.Failed
    case RequestStatus.Working:
      return RequestState.Working
    case RequestStatus.Pending:
      return RequestState.Queued
  }
}

export enum RequestState {
  Initial,
  Invalid,
  Queued,
  Working,
  Completed,
  Failed,
}
