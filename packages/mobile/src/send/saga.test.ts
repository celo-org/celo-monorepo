import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { showError, showMessage } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { validateRecipientAddressSuccess } from 'src/identity/actions'
import {
  addressToE164NumberSelector,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
} from 'src/identity/reducer'
import { navigate, replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { urlFromUriData } from 'src/qrcode/schema'
import { BarcodeTypes } from 'src/qrcode/utils'
import { RecipientKind } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { Actions, HandleBarcodeDetectedAction, QrCode } from 'src/send/actions'
import { watchQrCodeDetections } from 'src/send/saga'
import {
  mockAccount,
  mockAccount2Invite,
  mockAccountInvite,
  mockE164Number,
  mockE164NumberInvite,
  mockName,
  mockQrCodeData,
  mockQrCodeData2,
  mockTransactionData,
} from 'test/values'

jest.mock('src/utils/time', () => ({
  clockInSync: () => true,
}))

const mockE164NumberToAddress: E164NumberToAddressType = {
  [mockE164NumberInvite]: [mockAccountInvite, mockAccount2Invite],
}

describe(watchQrCodeDetections, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to the send amount screen with a valid qr code', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData) }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        displayName: mockName,
        displayId: mockE164Number,
        e164PhoneNumber: mockE164Number,
        kind: RecipientKind.QrCode,
        contactId: undefined,
        phoneNumberLabel: undefined,
        thumbnailPath: undefined,
      },
    })
  })

  it('navigates to the send amount screen with a qr code with an empty display name', async () => {
    const data: QrCode = {
      type: BarcodeTypes.QR_CODE,
      data: urlFromUriData({
        address: mockQrCodeData.address,
        e164PhoneNumber: mockQrCodeData.e164PhoneNumber,
      }),
    }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        displayName: 'anonymous',
        displayId: mockE164Number,
        e164PhoneNumber: mockE164Number,
        kind: RecipientKind.QrCode,
        contactId: undefined,
        phoneNumberLabel: undefined,
        thumbnailPath: undefined,
      },
    })
  })

  it('navigates to the send amount screen with a qr code with an empty phone number', async () => {
    const data: QrCode = {
      type: BarcodeTypes.QR_CODE,
      data: urlFromUriData({
        address: mockQrCodeData.address,
        displayName: mockQrCodeData.displayName,
      }),
    }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        displayName: mockName,
        displayId: undefined,
        e164PhoneNumber: undefined,
        contactId: undefined,
        phoneNumberLabel: undefined,
        thumbnailPath: undefined,
        kind: RecipientKind.QrCode,
      },
    })
  })

  it('displays an error when scanning an invalid qr code', async () => {
    const INVALID_QR = 'not-json'
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: INVALID_QR }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
      .silentRun()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('displays an error when scanning a qr code with an invalid address', async () => {
    const INVALID_QR_ADDRESS = {
      address: 'not-an-address',
      e164PhoneNumber: '+>19999907599',
      displayName: 'Joe',
    }
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(INVALID_QR_ADDRESS) }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
      .silentRun()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('navigates to the send confirmation screen when secure send scan is successful for a send', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData2) }
    const qrAction: HandleBarcodeDetectedAction = {
      type: Actions.BARCODE_DETECTED,
      data,
      scanIsForSecureSend: true,
      transactionData: mockTransactionData,
    }
    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
      ])
      .dispatch(qrAction)
      .put(validateRecipientAddressSuccess(mockE164NumberInvite, mockAccount2Invite.toLowerCase()))
      .silentRun()
    expect(replace).toHaveBeenCalledWith(Screens.SendConfirmation, {
      transactionData: mockTransactionData,
      addressJustValidated: true,
    })
  })

  it('navigates to the payment request confirmation screen when secure send scan is successful for a request', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData2) }
    const qrAction: HandleBarcodeDetectedAction = {
      type: Actions.BARCODE_DETECTED,
      data,
      scanIsForSecureSend: true,
      isOutgoingPaymentRequest: true,
      transactionData: mockTransactionData,
    }
    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
      ])
      .dispatch(qrAction)
      .put(validateRecipientAddressSuccess(mockE164NumberInvite, mockAccount2Invite.toLowerCase()))
      .silentRun()
    expect(replace).toHaveBeenCalledWith(Screens.PaymentRequestConfirmation, {
      transactionData: mockTransactionData,
      addressJustValidated: true,
    })
  })

  it("displays an error when QR code scanned for secure send doesn't map to the recipient", async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData) }
    const qrAction: HandleBarcodeDetectedAction = {
      type: Actions.BARCODE_DETECTED,
      data,
      scanIsForSecureSend: true,
      transactionData: mockTransactionData,
    }
    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(recipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
      ])
      .dispatch(qrAction)
      .put(showMessage(ErrorMessages.QR_FAILED_INVALID_RECIPIENT))
      .silentRun()
    expect(replace).not.toHaveBeenCalled()
  })
})
