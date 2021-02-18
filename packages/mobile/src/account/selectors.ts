import { RootState } from 'src/redux/reducers'

export const getE164PhoneNumber = (state: RootState) => {
  return state.account.e164PhoneNumber
}
export const devModeSelector = (state: RootState) => state.account.devModeActive
export const nameSelector = (state: RootState) => state.account.name
export const e164NumberSelector = (state: RootState) => state.account.e164PhoneNumber
export const pictureSelector = (state: RootState) => state.account.pictureUri
export const defaultCountryCodeSelector = (state: RootState) => state.account.defaultCountryCode
export const userContactDetailsSelector = (state: RootState) => state.account.contactDetails
export const pincodeTypeSelector = (state: RootState) => state.account.pincodeType
export const promptFornoIfNeededSelector = (state: RootState) => state.account.promptFornoIfNeeded
export const isProfileUploadedSelector = (state: RootState) => state.account.profileUploaded
export const cUsdDailyLimitSelector = (state: RootState) => state.account.dailyLimitCusd
