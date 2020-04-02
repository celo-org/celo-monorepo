import { PaymentRequestStatus } from 'src/account/types'
import { RootState } from 'src/redux/reducers'

export const getIncomingPaymentRequests = (state: RootState) => {
  return (state.account.incomingPaymentRequests || []).filter(
    (p) => p.status === PaymentRequestStatus.REQUESTED
  )
}

export const getOutgoingPaymentRequests = (state: RootState) => {
  return (state.account.outgoingPaymentRequests || []).filter(
    (p) => p.status === PaymentRequestStatus.REQUESTED
  )
}

export const getE164PhoneNumber = (state: RootState) => {
  return state.account.e164PhoneNumber
}

export const devModeSelector = (state: RootState) => state.account.devModeActive
export const nameSelector = (state: RootState) => state.account.name
export const e164NumberSelector = (state: RootState) => state.account.e164PhoneNumber
export const defaultCountryCodeSelector = (state: RootState) => state.account.defaultCountryCode
export const userContactDetailsSelector = (state: RootState) => state.account.contactDetails
export const pincodeTypeSelector = (state: RootState) => state.account.pincodeType
export const promptFornoIfNeededSelector = (state: RootState) => state.account.promptFornoIfNeeded
