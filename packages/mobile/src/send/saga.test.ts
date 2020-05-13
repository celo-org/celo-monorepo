import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { addressToE164NumberSelector } from 'src/identity/reducer'
import { inviteesSelector } from 'src/invite/reducer'
import { replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { BarcodeTypes } from 'src/qrcode/utils'
import { RecipientKind } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { Actions, QrCode } from 'src/send/actions'
import { watchQrCodeDetections } from 'src/send/saga'
import { mockAccount, mockE164Number, mockName, mockQrCodeData } from 'test/values'

jest.mock('src/utils/time', () => ({
  clockInSync: () => true,
}))

jest.mock('src/invite/reducer', () => ({
  ...jest.requireActual('src/invite/reducer'),
  inviteesSelector: () => ({}),
}))

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
      .provide([
        [select(inviteesSelector), {}],
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(replace).toHaveBeenCalledWith(Screens.SendAmount, {
      recipient: {
        address: mockAccount,
        displayName: mockName,
        displayId: mockE164Number,
        e164PhoneNumber: mockE164Number,
        kind: RecipientKind.QrCode,
      },
    })
  })

  it('navigates to the send amount screen with a qr code with an invalid display name', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: mockQrCodeData.replace(mockName, '') }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(inviteesSelector), {}],
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(replace).toHaveBeenCalledWith(Screens.SendAmount, {
      recipient: {
        address: mockAccount,
        displayName: '',
        displayId: mockE164Number,
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
      .provide([
        [select(inviteesSelector), {}],
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(replace).toHaveBeenCalledWith(Screens.SendAmount, {
      recipient: {
        address: mockAccount,
        displayName: mockName,
        displayId: '',
        e164PhoneNumber: '',
        kind: RecipientKind.QrCode,
      },
    })
  })

  it('displays an error when scanning an invalid qr code', async () => {
    const INVALID_QR = 'not-json'
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: INVALID_QR }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(inviteesSelector), {}],
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .put(showError(ErrorMessages.QR_FAILED_NO_ADDRESS))
      .silentRun()
    expect(replace).not.toHaveBeenCalled()
  })

  it('displays an error when scanning a qr code with no address', async () => {
    const INVALID_QR_NO_ADDRESS = '{"e164PhoneNumber":"+>19999907599","displayName":"Joe"}'
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: INVALID_QR_NO_ADDRESS }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(inviteesSelector), {}],
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .put(showError(ErrorMessages.QR_FAILED_NO_ADDRESS))
      .silentRun()
    expect(replace).not.toHaveBeenCalled()
  })

  it('displays an error when scanning a qr code with an invalid address', async () => {
    const INVALID_QR_ADDRESS =
      '{"address":"not-an-address","e164PhoneNumber":"+>19999907599","displayName":"Joe"}'
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: INVALID_QR_ADDRESS }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(inviteesSelector), {}],
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
      .silentRun()
    expect(replace).not.toHaveBeenCalled()
  })
})
