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

export const EXAMPLE_ADDRESS = 'a0000aaa00a0000...a00a0a0000a00a00aa'

// This is only a basic validation
function validateAddress(address: string) {
  return /^(0x)?[0-9a-f]{40}$/i.test(address)
}

export function requestStatusToState(status: RequestStatus) {
  switch (status) {
    case RequestStatus.Done:
      return RequestState.Completed
    case RequestStatus.Failed:
      return RequestState.Failed
    case RequestStatus.Working:
    case RequestStatus.Pending:
      return RequestState.Working
  }
}

export enum RequestState {
  Initial,
  Invalid,
  Working,
  Completed,
  Failed,
}
