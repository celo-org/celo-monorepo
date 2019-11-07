import { expectSaga, testSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { setPincodeFailure, setPincodeSuccess } from 'src/account/actions'
import { PincodeType, pincodeTypeSelector } from 'src/account/reducer'
import { getPincode, setPincode } from 'src/account/saga'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { setCachedPincode } from 'src/pincode/PincodeCache'
import { setPinInKeystore } from 'src/pincode/PincodeUtils'

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

  it('throws error for unset pin', async () => {
    try {
      await expectSaga(getPincode)
        .provide([[select(pincodeTypeSelector), PincodeType.Unset]])
        .run()
    } catch (error) {
      expect(error.message).toBe('Pin has never been set')
    }
  })

  it('does not touch cache', async () => {
    await testSaga(getPincode, false)
      .next()
      .next(PincodeType.CustomPin)
      .next(mockPin)
      .returns(mockPin)
  })
})
