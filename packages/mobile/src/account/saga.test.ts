import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { setPincodeFailure, setPincodeSuccess } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { getPincode, setPincode } from 'src/account/saga'
import { pincodeTypeSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { setPinInKeystore } from 'src/pincode/PhoneAuthUtils'
import { getCachedPincode, setCachedPincode } from 'src/pincode/PincodeCache'

const mockPin = '123456'

describe('@setPincode', () => {
  it('sets a PIN in phone keystore', async () => {
    await expectSaga(setPincode, { pincodeType: PincodeType.PhoneAuth })
      .put(setPincodeSuccess(PincodeType.PhoneAuth))
      .run()

    expect(setPinInKeystore).toHaveBeenCalled()
  })

  it('returns custom PIN', async () => {
    await expectSaga(setPincode, { pincodeType: PincodeType.CustomPin, pin: mockPin })
      .put(setPincodeSuccess(PincodeType.CustomPin))
      .run()

    expect(setCachedPincode).toHaveBeenCalled()
  })

  it('throws error for unset pin', async () => {
    await expectSaga(setPincode, { pincodeType: PincodeType.CustomPin })
      .put(showError(ErrorMessages.SET_PIN_FAILED))
      .put(setPincodeFailure())
      .run()
  })
})

describe('@getPincode', () => {
  const mockedNavigate = navigate as jest.Mock
  const mockedGetCachedPincode = getCachedPincode as jest.Mock
  it('returns PIN from phone keystore', async () => {
    await expectSaga(getPincode)
      .provide([[select(pincodeTypeSelector), PincodeType.PhoneAuth]])
      .returns(mockPin)
      .run()
  })

  it('returns custom PIN', async () => {
    await expectSaga(getPincode)
      .provide([[select(pincodeTypeSelector), PincodeType.CustomPin]])
      .returns(mockPin)
      .run()
  })

  it('returns custom PIN without cache', async () => {
    mockedGetCachedPincode.mockReturnValueOnce(null)
    mockedNavigate.mockImplementationOnce((_, params) => {
      expect(params.withVerification).toBe(true)
      params.onSuccess(mockPin)
    })
    await expectSaga(getPincode)
      .provide([[select(pincodeTypeSelector), PincodeType.CustomPin]])
      .returns(mockPin)
      .run()
    expect(navigate).toHaveBeenCalled()
    expect(navigateBack).toHaveBeenCalled()
    expect(setCachedPincode).toHaveBeenCalledWith(mockPin)
  })

  it('returns custom PIN without cache and verification', async () => {
    mockedGetCachedPincode.mockReturnValueOnce(null)
    mockedNavigate.mockImplementationOnce((_, params) => {
      expect(params.withVerification).toBe(false)
      params.onSuccess(mockPin)
    })
    await expectSaga(getPincode, false)
      .provide([[select(pincodeTypeSelector), PincodeType.CustomPin]])
      .returns(mockPin)
      .run()
    expect(navigate).toHaveBeenCalled()
    expect(navigateBack).toHaveBeenCalled()
    expect(setCachedPincode).toHaveBeenCalledWith(mockPin)
  })

  it('throws error for unset pin', async () => {
    try {
      await expectSaga(getPincode)
        .provide([[select(pincodeTypeSelector), PincodeType.Unset]])
        .run()
    } catch (error) {
      expect(error.message).toBe('Pin has never been set')
    }
  })
})
