import * as Keychain from 'react-native-keychain'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import {
  CANCELLED_PIN_INPUT,
  DEFAULT_CACHE_ACCOUNT,
  getPasswordSaga,
  getPincode,
} from 'src/pincode/authentication'
import { clearPasswordCaches, getCachedPin, setCachedPin } from 'src/pincode/PasswordCache'
import { mockAccount } from 'test/values'

const mockPepper = { password: '0000000000000000000000000000000000000000000000000000000000000001' }
const mockPin = '111555'

describe(getPasswordSaga, () => {
  const mockedNavigate = navigate as jest.Mock

  it('Gets password', async () => {
    mockedNavigate.mockImplementationOnce((_, params) => {
      expect(params.withVerification).toBe(true)
      params.onSuccess(mockPin)
    })

    const mockGetGenericPassword = Keychain.getGenericPassword as jest.Mock
    mockGetGenericPassword.mockResolvedValue(mockPepper)
    const expectedPassword = mockPepper.password + mockPin

    await expectSaga(getPasswordSaga, mockAccount, true, false)
      .provide([[select(pincodeTypeSelector), PincodeType.CustomPin]])
      .returns(expectedPassword)
      .run()

    // expect(navigate).toHaveBeenCalled()
    // expect(navigateBack).toHaveBeenCalled()
  })
})

describe(getPincode, () => {
  const mockedNavigate = navigate as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockedNavigate.mockReset()
  })

  it('returns PIN from cache', async () => {
    setCachedPin(DEFAULT_CACHE_ACCOUNT, mockPin)
    const pin = await getPincode()
    expect(pin).toBe(mockPin)
  })
  it('returns pin and stores it in cache', async () => {
    clearPasswordCaches()
    mockedNavigate.mockImplementationOnce((_, params) => {
      expect(params.withVerification).toBe(true)
      params.onSuccess(mockPin)
    })
    const pin = await getPincode()
    expect(pin).toEqual(mockPin)
    expect(navigate).toHaveBeenCalled()
    expect(navigateBack).toHaveBeenCalled()
    expect(getCachedPin(DEFAULT_CACHE_ACCOUNT)).toEqual(pin)
  })
  it('throws an error if user cancels the Pin input', async () => {
    clearPasswordCaches()
    mockedNavigate.mockImplementationOnce((_, params) => {
      params.onCancel()
    })
    expect.assertions(4)
    try {
      await getPincode()
    } catch (error) {
      expect(error).toEqual(CANCELLED_PIN_INPUT)
    }
    expect(navigate).toHaveBeenCalled()
    expect(navigateBack).not.toHaveBeenCalled()
    expect(getCachedPin(DEFAULT_CACHE_ACCOUNT)).toBeNull()
  })
})
