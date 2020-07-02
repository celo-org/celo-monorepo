import * as Keychain from 'react-native-keychain'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { getPasswordSaga, getPincode } from 'src/pincode/authentication'
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

    expect(navigate).toHaveBeenCalled()
    expect(navigateBack).toHaveBeenCalled()
  })
})

describe(getPincode, () => {
  // it('returns PIN from phone keystore', async () => {
  //   // // const mockStore = store as jest.Mock
  //   // mockStore.mockImplementation(() => {})
  //   const pin = await getPincode()
  //   expect(pin).toBe(mockPin)
  // })
  // it('returns custom PIN', async () => {
  //   await expectSaga(getPincode)
  //     .provide([[select(pincodeTypeSelector), PincodeType.CustomPin]])
  //     .returns(mockPin)
  //     .run()
  // })
  // it('returns custom PIN without cache', async () => {
  //   mockedGetCachedPincode.mockReturnValueOnce(null)
  //   mockedNavigate.mockImplementationOnce((_, params) => {
  //     expect(params.withVerification).toBe(true)
  //     params.onSuccess(mockPin)
  //   })
  //   await expectSaga(getPincode)
  //     .provide([[select(pincodeTypeSelector), PincodeType.CustomPin]])
  //     .returns(mockPin)
  //     .run()
  //   expect(navigate).toHaveBeenCalled()
  //   expect(navigateBack).toHaveBeenCalled()
  //   expect(setCachedPincode).toHaveBeenCalledWith(mockPin)
  // })
  // it('returns custom PIN without cache and verification', async () => {
  //   mockedGetCachedPincode.mockReturnValueOnce(null)
  //   mockedNavigate.mockImplementationOnce((_, params) => {
  //     expect(params.withVerification).toBe(false)
  //     params.onSuccess(mockPin)
  //   })
  //   await expectSaga(getPincode, false)
  //     .provide([[select(pincodeTypeSelector), PincodeType.CustomPin]])
  //     .returns(mockPin)
  //     .run()
  //   expect(navigate).toHaveBeenCalled()
  //   expect(navigateBack).toHaveBeenCalled()
  //   expect(setCachedPincode).toHaveBeenCalledWith(mockPin)
  // })
  // it('throws error for unset pin', async () => {
  //   try {
  //     await expectSaga(getPincode)
  //       .provide([[select(pincodeTypeSelector), PincodeType.Unset]])
  //       .run()
  //   } catch (error) {
  //     expect(error.message).toBe('Pin has never been set')
  //   }
  // })
})
