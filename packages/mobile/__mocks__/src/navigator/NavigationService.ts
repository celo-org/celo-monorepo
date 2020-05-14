export const navigate = jest.fn()
export const replace = jest.fn()
export const navigateHome = jest.fn()
export const navigateBack = jest.fn()
export const navigateProtected = jest.fn()
export const ensurePincode = jest.fn()

export enum NavActions {
  SET_NAVIGATOR = 'NAVIGATION/SET_NAVIGATOR',
}
