import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ERROR_BANNER_DURATION } from 'src/config'
import { addressToE164NumberSelector } from 'src/identity/reducer'
import { Screens } from 'src/navigator/Screens'
import { BarcodeTypes } from 'src/qrcode/utils'
import { Actions, QrCode } from 'src/send/actions'
import { recipientCacheSelector } from 'src/send/reducers'
import { watchQrCodeDetections } from 'src/send/saga'
import { RecipientKind } from 'src/utils/recipient'
import { mockAccount, mockE164Number, mockName, mockQrCodeData } from 'test/values'

jest.mock('src/utils/time', () => ({
  clockInSync: () => true,
}))

jest.mock('src/identity/reducer', () => ({
  ...jest.requireActual('src/identity/reducer'),
  addressToE164NumberSelector: (state: any) => ({}),
}))

jest.mock('src/navigator/NavigationService', () => ({
  ...jest.requireActual('src/navigator/NavigationService'),
  navigate: jest.fn(),
}))

const { navigate } = require('src/navigator/NavigationService')

describe(watchQrCodeDetections, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to the send amount screen with a valid qr code', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: mockQrCodeData }

    await expectSaga(watchQrCodeDetections)
      .provide([[select(addressToE164NumberSelector), {}], [select(recipientCacheSelector), {}]])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      recipient: {
        address: mockAccount,
        displayName: mockName,
        displayPhoneNumber: mockE164Number,
        e164PhoneNumber: mockE164Number,
        kind: RecipientKind.QrCode,
      },
    })
  })

  it('navigates to the send amount screen with a qr code with an invalid display name', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: mockQrCodeData.replace(mockName, '') }

    await expectSaga(watchQrCodeDetections)
      .provide([[select(addressToE164NumberSelector), {}], [select(recipientCacheSelector), {}]])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      recipient: {
        address: mockAccount,
        displayName: '',
        displayPhoneNumber: mockE164Number,
        e164PhoneNumber: mockE164Number,
        kind: RecipientKind.QrCode,
      },
    })
  })

  it('navigates to the send amount screen with a qr code with an invalid phone number', async () => {
    const data: QrCode = {
      type: BarcodeTypes.QR_CODE,
      data: mockQrCodeData.replace(mockE164Number, ''),
    }

    await expectSaga(watchQrCodeDetections)
      .provide([[select(addressToE164NumberSelector), {}], [select(recipientCacheSelector), {}]])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      recipient: {
        address: mockAccount,
        displayName: mockName,
        displayPhoneNumber: '',
        e164PhoneNumber: '',
        kind: RecipientKind.QrCode,
      },
    })
  })

  it('displays an error when scanning an invalid qr code', async () => {
    const INVALID_QR = 'not-json'
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: INVALID_QR }

    await expectSaga(watchQrCodeDetections)
      .provide([[select(addressToE164NumberSelector), {}], [select(recipientCacheSelector), {}]])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .put(showError(ErrorMessages.QR_FAILED_NO_ADDRESS, ERROR_BANNER_DURATION))
      .silentRun()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('displays an error when scanning a qr code with no address', async () => {
    const INVALID_QR_NO_ADDRESS = '{"e164PhoneNumber":"+>19999907599","displayName":"Joe"}'
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: INVALID_QR_NO_ADDRESS }

    await expectSaga(watchQrCodeDetections)
      .provide([[select(addressToE164NumberSelector), {}], [select(recipientCacheSelector), {}]])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .put(showError(ErrorMessages.QR_FAILED_NO_ADDRESS, ERROR_BANNER_DURATION))
      .silentRun()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('displays an error when scanning a qr code with an invalid address', async () => {
    const INVALID_QR_ADDRESS =
      '{"address":"not-an-address","e164PhoneNumber":"+>19999907599","displayName":"Joe"}'
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: INVALID_QR_ADDRESS }

    await expectSaga(watchQrCodeDetections)
      .provide([[select(addressToE164NumberSelector), {}], [select(recipientCacheSelector), {}]])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS, ERROR_BANNER_DURATION))
      .silentRun()
    expect(navigate).not.toHaveBeenCalled()
  })
})
